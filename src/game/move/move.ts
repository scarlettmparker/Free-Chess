import {
  charPieces,
  colors,
  gameState,
  getBitboard,
  moveType,
  unicodePieces,
} from '~/game/consts/board';
import { notToRawPos, rawPosToNot } from '~/game/board/square-helper';
import {
  getMoveCapture,
  getMoveCastle,
  getMoveDouble,
  getMoveEnpassant,
  getMovePiece,
  getMovePromoted,
  getMoveSource,
  getMoveTarget,
  MoveList,
  promotedPieces,
} from '~/game/move/move-def';
import setBit, { getBit, getLSFBIndex, getPieceById, BIT, NOT_BIT } from '~/game/board/bitboard';
import { castlingRights } from '~/game/consts/bits';
import { isSquareAttacked } from '~/game/board/attacks';
import { Piece, LeaperMoveBehavior } from '~/game/piece/piece';

/**
 * Adds a move to the move list.
 * @param moves Move list to add move to.
 * @param move Move to add to move list.
 */
export const addMove = (moves: MoveList, move: number) => {
  moves.moves[moves.count] = move;
  moves.count++;
};

/**
 * Undo record returned by applyMove and consumed by undoMove.
 * Captures only the state that is not derivable from the move encoding itself.
 */
export type Undo = {
  capturedPiece: number;
  enpassant: number;
  castle: bigint;
  // Rotational piece bookkeeping (only meaningful when the mover is rotational).
  mapKeySrc: number;
  mapHadSrc: boolean;
  mapValSrc: number;
  mapKeyTgt: number;
  mapHadTgt: boolean;
  mapValTgt: number;
  reverseChanged: boolean;
  revKeySrc: number;
  revHadSrc: boolean;
  revValSrc: number;
  revKeyTgt: number;
  revHadTgt: boolean;
  revValTgt: number;
};

const WHITE = colors.WHITE;
const BLACK = colors.BLACK;

/**
 * Applies a move in place, mutating global game state, without testing legality.
 * Occupancies are updated incrementally (XOR) instead of full recompute.
 * @param move Encoded move.
 * @returns Undo record for undoMove.
 */
export const applyMove = (move: number): Undo => {
  const sourceSquare = getMoveSource(move);
  const targetSquare = getMoveTarget(move);
  const piece = getMovePiece(move);
  const promoted = getMovePromoted(move);
  const capture = getMoveCapture(move);
  const double = getMoveDouble(move);
  const enpassantFlag = getMoveEnpassant(move);
  const castling = getMoveCastle(move);

  const mover = gameState.side;
  const opponent = mover ^ 1;
  const bitboards = gameState.bitboards;
  const occ = gameState.occupancies;

  const undo: Undo = {
    capturedPiece: -1,
    enpassant: gameState.enpassant,
    castle: gameState.castle,
    mapKeySrc: 0,
    mapHadSrc: false,
    mapValSrc: 0,
    mapKeyTgt: 0,
    mapHadTgt: false,
    mapValTgt: 0,
    reverseChanged: false,
    revKeySrc: 0,
    revHadSrc: false,
    revValSrc: 0,
    revKeyTgt: 0,
    revHadTgt: false,
    revValTgt: 0,
  };

  const srcBit = BIT[sourceSquare];
  const tgtBit = BIT[targetSquare];

  // move the piece (clear source, set target)
  const moverBB = bitboards[piece];
  moverBB.bitboard = (moverBB.bitboard & NOT_BIT[sourceSquare]) | tgtBit;
  const moveDelta = srcBit | tgtBit;
  occ[mover] ^= moveDelta;

  // captures (find the opponent piece on the target square and clear it)
  if (capture) {
    const opponentPieceIds = mover == WHITE ? gameState.blackPieceIds : gameState.whitePieceIds;
    for (let i = 0; i < opponentPieceIds.length; i++) {
      const bbPiece = opponentPieceIds[i];
      const capBB = bitboards[bbPiece];
      if (capBB.bitboard & tgtBit) {
        capBB.bitboard &= NOT_BIT[targetSquare];
        undo.capturedPiece = bbPiece;
        occ[opponent] ^= tgtBit;
        break;
      }
    }
  }

  // promotions (mover leaves target, promoted piece occupies it — same side, no occ delta)
  if (promoted) {
    moverBB.bitboard &= NOT_BIT[targetSquare];
    bitboards[promoted].bitboard |= tgtBit;
  }

  // en passant (captured pawn sits behind the target square)
  if (enpassantFlag) {
    const capPawnId = mover == WHITE ? charPieces.p : charPieces.P;
    const capSquare = mover == WHITE ? targetSquare + 8 : targetSquare - 8;
    const capBit = BIT[capSquare];
    bitboards[capPawnId].bitboard &= NOT_BIT[capSquare];
    occ[opponent] ^= capBit;
  }

  // reset / set en passant square
  gameState.enpassant = double ? (mover == WHITE ? targetSquare + 8 : targetSquare - 8) : -1;

  // castling: move the rook
  if (castling) {
    let rookId: number;
    let rookFrom: number;
    let rookTo: number;
    switch (targetSquare) {
      case notToRawPos['g1']:
        rookId = charPieces.R;
        rookFrom = notToRawPos['h1'];
        rookTo = notToRawPos['f1'];
        break;
      case notToRawPos['c1']:
        rookId = charPieces.R;
        rookFrom = notToRawPos['a1'];
        rookTo = notToRawPos['d1'];
        break;
      case notToRawPos['g8']:
        rookId = charPieces.r;
        rookFrom = notToRawPos['h8'];
        rookTo = notToRawPos['f8'];
        break;
      default:
        rookId = charPieces.r;
        rookFrom = notToRawPos['a8'];
        rookTo = notToRawPos['d8'];
        break;
    }
    const rookBit = BIT[rookFrom] | BIT[rookTo];
    bitboards[rookId].bitboard ^= rookBit;
    occ[mover] ^= rookBit;
  }

  // update castling rights
  gameState.castle = BigInt(
    Number(gameState.castle) & castlingRights[sourceSquare] & castlingRights[targetSquare],
  );

  // both-sides occupancy = union (cheap single OR)
  occ[colors.BOTH] = occ[WHITE] | occ[BLACK];

  // rotational pieces maintain per-square move counters; standard pieces skip this entirely.
  const pieceObj = getPieceById(piece);
  if (pieceObj) {
    const rot = pieceObj.getRotationalMoveType();
    if (rot === 'ROTATE' || rot === 'REVERSE_ROTATE') {
      const pieceMoves = mover == WHITE ? gameState.whiteMoves : gameState.blackMoves;
      const mapKeySrc = Number(`${sourceSquare}${piece}`);
      const mapKeyTgt = Number(`${targetSquare}${piece}`);
      undo.mapKeySrc = mapKeySrc;
      undo.mapHadSrc = pieceMoves.has(mapKeySrc);
      undo.mapValSrc = undo.mapHadSrc ? (pieceMoves.get(mapKeySrc) as number) : 0;
      undo.mapKeyTgt = mapKeyTgt;
      undo.mapHadTgt = pieceMoves.has(mapKeyTgt);
      undo.mapValTgt = undo.mapHadTgt ? (pieceMoves.get(mapKeyTgt) as number) : 0;

      const prev = undo.mapValSrc;
      pieceMoves.delete(mapKeySrc);
      pieceMoves.set(mapKeyTgt, prev + 1);

      if (rot === 'REVERSE_ROTATE') {
        undo.reverseChanged = true;
        updateRotatorMoves(pieceObj, pieceMoves, sourceSquare, targetSquare, undo);
      }
    }
  }

  // change side
  gameState.side = opponent;
  return undo;
};

/**
 * Reverts a move previously applied by applyMove.
 * @param move Encoded move (same one passed to applyMove).
 * @param undo Undo record returned by applyMove.
 */
export const undoMove = (move: number, undo: Undo) => {
  const sourceSquare = getMoveSource(move);
  const targetSquare = getMoveTarget(move);
  const piece = getMovePiece(move);
  const promoted = getMovePromoted(move);
  const capture = getMoveCapture(move);
  const enpassantFlag = getMoveEnpassant(move);
  const castling = getMoveCastle(move);

  // the side that moved is the side now NOT to move (state was flipped by applyMove)
  const mover = gameState.side ^ 1;
  const opponent = mover ^ 1;
  const bitboards = gameState.bitboards;
  const occ = gameState.occupancies;

  const srcBit = BIT[sourceSquare];
  const tgtBit = BIT[targetSquare];

  // restore side first
  gameState.side = mover;

  // undo castling rook
  if (castling) {
    let rookId: number;
    let rookFrom: number;
    let rookTo: number;
    switch (targetSquare) {
      case notToRawPos['g1']:
        rookId = charPieces.R;
        rookFrom = notToRawPos['h1'];
        rookTo = notToRawPos['f1'];
        break;
      case notToRawPos['c1']:
        rookId = charPieces.R;
        rookFrom = notToRawPos['a1'];
        rookTo = notToRawPos['d1'];
        break;
      case notToRawPos['g8']:
        rookId = charPieces.r;
        rookFrom = notToRawPos['h8'];
        rookTo = notToRawPos['f8'];
        break;
      default:
        rookId = charPieces.r;
        rookFrom = notToRawPos['a8'];
        rookTo = notToRawPos['d8'];
        break;
    }
    const rookBit = BIT[rookFrom] | BIT[rookTo];
    bitboards[rookId].bitboard ^= rookBit;
    occ[mover] ^= rookBit;
  }

  // undo promotion (promoted leaves target, original piece returns)
  if (promoted) {
    bitboards[promoted].bitboard &= NOT_BIT[targetSquare];
    bitboards[piece].bitboard |= tgtBit;
  }

  // undo en passant capture
  if (enpassantFlag) {
    const capPawnId = mover == WHITE ? charPieces.p : charPieces.P;
    const capSquare = mover == WHITE ? targetSquare + 8 : targetSquare - 8;
    const capBit = BIT[capSquare];
    bitboards[capPawnId].bitboard |= capBit;
    occ[opponent] ^= capBit;
  }

  // undo normal capture
  if (capture && undo.capturedPiece !== -1) {
    bitboards[undo.capturedPiece].bitboard |= tgtBit;
    occ[opponent] ^= tgtBit;
  }

  // move the piece back (clear target, set source)
  const moverBB = bitboards[piece];
  moverBB.bitboard = (moverBB.bitboard & NOT_BIT[targetSquare]) | srcBit;
  occ[mover] ^= srcBit | tgtBit;

  // restore occupancies union + state
  occ[colors.BOTH] = occ[WHITE] | occ[BLACK];
  gameState.enpassant = undo.enpassant;
  gameState.castle = undo.castle;

  // restore rotational piece bookkeeping
  if (undo.reverseChanged || undo.mapHadSrc || undo.mapHadTgt || undo.mapKeySrc !== 0) {
    const pieceMoves = mover == WHITE ? gameState.whiteMoves : gameState.blackMoves;
    if (undo.mapKeySrc !== 0) {
      if (undo.mapHadSrc) pieceMoves.set(undo.mapKeySrc, undo.mapValSrc);
      else pieceMoves.delete(undo.mapKeySrc);
    }
    if (undo.mapKeyTgt !== 0) {
      if (undo.mapHadTgt) pieceMoves.set(undo.mapKeyTgt, undo.mapValTgt);
      else pieceMoves.delete(undo.mapKeyTgt);
    }
  }
  if (undo.reverseChanged) {
    const pieceObj = getPieceById(piece);
    if (pieceObj) {
      const rev = pieceObj.getReverse();
      if (undo.revHadSrc) rev.set(undo.revKeySrc, undo.revValSrc);
      else rev.delete(undo.revKeySrc);
      if (undo.revHadTgt) rev.set(undo.revKeyTgt, undo.revValTgt);
      else rev.delete(undo.revKeyTgt);
    }
  }
};

/**
 * Returns true if the side that just moved has left its king in check.
 * Must be called immediately after applyMove (side has already been flipped).
 */
export const moverKingInCheck = () => {
  // gameState.side is now the opponent; the mover's king is the other colour's king.
  const kingId = gameState.side == WHITE ? charPieces.k : charPieces.K;
  return isSquareAttacked(getLSFBIndex(getBitboard(kingId).bitboard), gameState.side);
};

/**
 * Applies a move, tests legality, and reverts it if illegal.
 * @param move Encoded move.
 * @returns 1 (legal, move stays applied), 0 (illegal, state reverted).
 */
export const makeMove = (move: number, moveFlag: number, _currentMove: number): number => {
  if (moveFlag == moveType.ALL_MOVES) {
    const undo = applyMove(move);
    if (moverKingInCheck()) {
      undoMove(move, undo);
      return 0;
    }
    return 1;
  }
  // capture-only mode (unused by the current engine): accept captures only.
  if (getMoveCapture(move)) {
    return makeMove(move, moveType.ALL_MOVES, 0);
  }
  return 0;
};

/**
 * Tests whether a move is legal without leaving it applied.
 * @param move Encoded move.
 */
export const isLegalMove = (move: number) => {
  const undo = applyMove(move);
  const legal = !moverKingInCheck();
  undoMove(move, undo);
  return legal;
};

/**
 * Function to update a piece's rotator move state based on its position on the board.
 * Once a piece hits the edge of the board, the piece's potential moves flip.
 *
 * @param pieceObj Piece object to update.
 * @param tempMoves Temp moves denoting the piece's position and its current move. If it hits the edge of the board it resets.
 * @param sourceSquare The piece's current position.
 * @param targetSquare The piece's target position after moving.
 * @param undo Undo record to capture reverse-map mutations for unmake.
 */
const updateRotatorMoves = (
  pieceObj: Piece,
  tempMoves: Map<number, number>,
  sourceSquare: number,
  targetSquare: number,
  undo: Undo,
) => {
  const tempReverse = pieceObj.getReverse();

  // capture pre-mutation state of the two keys we will touch, for unmake
  undo.revKeySrc = sourceSquare;
  undo.revHadSrc = tempReverse.has(sourceSquare);
  undo.revValSrc = undo.revHadSrc ? (tempReverse.get(sourceSquare) as number) : 0;
  undo.revKeyTgt = targetSquare;
  undo.revHadTgt = tempReverse.has(targetSquare);
  undo.revValTgt = undo.revHadTgt ? (tempReverse.get(targetSquare) as number) : 0;

  const newSquare = tempReverse.get(targetSquare) ?? 0;
  const oldSquare = tempReverse.get(sourceSquare);

  if (oldSquare !== undefined && oldSquare >= 0) {
    tempReverse.set(targetSquare, oldSquare);
  } else if (newSquare >= 0) {
    tempReverse.set(targetSquare, newSquare);
  } else {
    tempReverse.set(targetSquare, 0);
  }

  tempReverse.delete(sourceSquare);
  const rank = Math.floor(targetSquare / 8);

  // if a piece has hit the edge of the board
  if (rank === 7 || rank === 0) {
    const isWhite = pieceObj.getColor() === colors.WHITE;
    tempReverse.set(targetSquare, isWhite === (rank === 7) ? 0 : 1);
    tempMoves.set(Number(`${targetSquare}${pieceObj.getId()}`), 0);
  }

  pieceObj.setReverse(tempReverse);
};

/**
 * Function to check which move to look for in attack tables.
 * @param piece Piece object to search.
 * @param sourceSquare The piece's current position.
 */
export const getCheckMove = (piece: Piece, sourceSquare: number) => {
  const pieceMoveLength =
    piece.getMoveBehavior() instanceof LeaperMoveBehavior
      ? (piece.getMoveBehavior() as LeaperMoveBehavior).getLeaperOffsets().length
      : 1;
  const pieceMoves = piece.getColor() == colors.WHITE ? gameState.whiteMoves : gameState.blackMoves;
  let checkMove = 0;

  if (
    piece.getRotationalMoveType() == 'ROTATE' &&
    piece.getMoveBehavior() instanceof LeaperMoveBehavior
  ) {
    checkMove = (pieceMoves.get(Number('' + sourceSquare + piece.getId())) || 0) % pieceMoveLength;
  } else if (
    piece.getRotationalMoveType() == 'REVERSE_ROTATE' &&
    piece.getMoveBehavior() instanceof LeaperMoveBehavior
  ) {
    // flip moves when at right square
    const pieceDirection = piece.getReverse().get(sourceSquare) || 0;
    const offset = pieceDirection * (pieceMoveLength / 2);
    const currentMove = pieceMoves.get(Number(`${sourceSquare}${piece.getId()}`)) || 0;
    checkMove = offset + ((currentMove % pieceMoveLength) % (pieceMoveLength / 2));
  }

  return checkMove;
};

/**
 * Decodes an encoded move and prints it.
 * @param move Move to print.
 * @returns Printed list.
 */
export const printMove = (move: number) => {
  let output = '';
  output +=
    rawPosToNot[getMoveSource(move)] +
    rawPosToNot[getMoveTarget(move)] +
    promotedPieces[getMovePromoted(move)];
  return output;
};

/**
 * Prints a decoded list of moves.
 * @param moves List of moves to print.
 */
export const printMoveList = (moves: MoveList) => {
  if (moves.count == 0) {
    console.log('Move list is empty.');
    return;
  }

  let output = '';
  output += 'move   piece  capture  double  enpassant  castling\n';
  for (let moveCount = 0; moveCount < moves.count; moveCount++) {
    const move = moves.moves[moveCount];
    output +=
      rawPosToNot[getMoveSource(move)] +
      rawPosToNot[getMoveTarget(move)] +
      (getMovePromoted(move) ? promotedPieces[getMovePromoted(move)] : ' ') +
      '  ' +
      unicodePieces[getMovePiece(move)] +
      '     ' +
      (getMoveCapture(move) ? 1 : 0) +
      '        ' +
      (getMoveDouble(move) ? 1 : 0) +
      '       ' +
      (getMoveEnpassant(move) ? 1 : 0) +
      '          ' +
      (getMoveCastle(move) ? 1 : 0) +
      '\n';
  }
  output += `Total moves: ${moves.count}\n`;
  console.log(output);
};
