import { getBit, setBitLoHi } from './board/bitboard';
import { notToRawPos } from './board/square-helper';
import { gameState, BOARD_SIZE, getBitboard, castlePieces, colors } from './consts/board';

/**
 * Converts a standard FEN string into Free Chess piece ID format.
 * @param fen Standard FEN string
 * @returns Converted FEN string with piece IDs
 */
export const convertFEN = (fen: string): string => {
  const pieceMap: Record<string, number> = {
    P: 0,
    N: 2,
    B: 4,
    R: 6,
    Q: 8,
    K: 10,
    p: 1,
    n: 3,
    b: 5,
    r: 7,
    q: 9,
    k: 11,
  };

  // split FEN into board and other info
  const [board, turn, castling, enPassant, halfMove, fullMove] = fen.split(' ');

  // convert each rank
  const newBoard = board
    .split('/')
    .map((rank) => {
      let newRank = '';
      for (const char of rank) {
        if (/[1-8]/.test(char)) {
          newRank += char; // leave empty squares as-is
        } else {
          newRank += `[${pieceMap[char]}]`;
        }
      }
      return newRank;
    })
    .join('/');

  return `${newBoard} ${turn} ${castling} ${enPassant} ${halfMove} ${fullMove}`;
};

/**
 * Parses a FEN and sets the board's position.
 * @param fen FEN of a Chess board position.
 */
export const parseFEN = (fen: string) => {
  // reset board data
  gameState.occLo.fill(0);
  gameState.occHi.fill(0);

  // reset player data
  gameState.side = 0;
  gameState.enpassant = -1;
  gameState.castle = 0;

  // occupancies
  let fenIndex = 0;
  for (let rank = 0; rank < BOARD_SIZE; rank++) {
    for (let file = 0; file < BOARD_SIZE; file++) {
      const square = rank * 8 + file;
      const char = fen[fenIndex];

      // match pieces based on square brackets containing Ids
      if (char === '[') {
        const endBracketIndex = fen.indexOf(']', fenIndex);
        if (endBracketIndex === -1) {
          throw new Error("Invalid FEN format: unmatched '['.");
        }

        const pieceId = parseInt(fen.slice(fenIndex + 1, endBracketIndex), 10);
        if (isNaN(pieceId)) {
          throw new Error('Invalid FEN format: invalid piece id.');
        }

        const piece = gameState.pieces.find((p) => p.getId() === pieceId);
        if (!piece) {
          throw new Error(`Piece with id ${pieceId} not found.`);
        }

        let bitboardData = gameState.bitboards.find((b) => b.pieceId === pieceId);
        if (!bitboardData) {
          gameState.bitboards.push({ pieceId, lo: 0, hi: 0 });
          bitboardData = gameState.bitboards[gameState.bitboards.length - 1];
        }

        setBitLoHi(bitboardData, square, true);

        fenIndex = endBracketIndex + 1;
      } else if (char >= '0' && char <= '9') {
        const offset = Number(char);
        let piece = -1;

        // loop over all piece bitboards
        for (let bbPiece = 0; bbPiece < gameState.bitboards.length; bbPiece++) {
          const bb = getBitboard(bbPiece);
          if (getBit(bb.lo, bb.hi, square)) {
            piece = bbPiece;
          }
        }

        if (piece === -1) file--;
        file += offset;
        fenIndex++;
      } else if (char === '/') {
        fenIndex++;
      }
    }

    fenIndex++;
  }

  // parse side to move
  fen[fenIndex] == 'w' ? (gameState.side = 0) : (gameState.side = 1);
  fenIndex += 2;

  // parse castling rights
  while (fen[fenIndex] != ' ') {
    let currCastle = gameState.castle;
    switch (fen[fenIndex]) {
      case 'K':
        currCastle |= castlePieces.wk;
        break;
      case 'Q':
        currCastle |= castlePieces.wq;
        break;
      case 'k':
        currCastle |= castlePieces.bk;
        break;
      case 'q':
        currCastle |= castlePieces.bq;
        break;
      case '-':
        break;
    }
    gameState.castle = currCastle;
    fenIndex++;
  }

  fenIndex++;

  // parse en passant square
  if (fen[fenIndex] != '-') {
    const file = fen[fenIndex];
    const rank = fen[fenIndex + 1];
    const square = notToRawPos[file + rank];
    gameState.enpassant = square;
  } else {
    gameState.enpassant = -1;
  }

  // loop over white pieces bitboard
  let whiteLo = 0;
  let whiteHi = 0;
  for (const piece of gameState.whitePieceIds) {
    const bb = getBitboard(piece);
    whiteLo |= bb.lo;
    whiteHi |= bb.hi;
  }
  gameState.occLo[colors.WHITE] = whiteLo;
  gameState.occHi[colors.WHITE] = whiteHi;

  // loop over black pieces bitboard
  let blackLo = 0;
  let blackHi = 0;
  for (const piece of gameState.blackPieceIds) {
    const bb = getBitboard(piece);
    blackLo |= bb.lo;
    blackHi |= bb.hi;
  }
  gameState.occLo[colors.BLACK] = blackLo;
  gameState.occHi[colors.BLACK] = blackHi;

  // include all occupancies in both
  gameState.occLo[colors.BOTH] = whiteLo | blackLo;
  gameState.occHi[colors.BOTH] = whiteHi | blackHi;
};
