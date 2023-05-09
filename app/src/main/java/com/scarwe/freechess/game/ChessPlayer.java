package com.scarwe.freechess.game;

import com.scarwe.freechess.R;

import java.io.Console;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;

public class ChessPlayer {

    public boolean turn = false;
    public boolean checked = false;
    public boolean discovered = false;

    public int colour;
    public int castled;
    public int piecesDiscovered;

    public ArrayList<ChessPiece> pieces = new ArrayList<>();

    // used to calculate legal moves, this allows board to be reset
    public ArrayList<ChessPiece> tempWhitePieces = new ArrayList<>();
    public ArrayList<ChessPiece> tempBlackPieces = new ArrayList<>();

    public ChessPiece currentAttackingPiece;

    public ChessPlayer(int colour) {
        this.colour = colour;
    }

    public void setTurn(boolean turn) {
        this.turn = turn;
    }

    public boolean pawnJustCaptured = false;
    public boolean captureMove = false;

    public int sincePawnMoved = -1;
    public int sinceCaptured = 0;
    {
        if (colour == 0) turn = true;
    }

    private boolean canEnPassant(Square from, Square to) {
        int movementCol, movementRow, enPassantRow;
        // depends which direction the capture is
        if (from.getCol() - to.getCol() == 1) movementCol = -1;
        else movementCol = 1;

        // determines pawn up or down
        if (this.colour == 0) {
            movementRow = 1;
            enPassantRow = 4;
        }
        else {
            movementRow = -1;
            enPassantRow = 3;
        }

        Square square = new Square(from.getCol() + movementCol, from.getRow());

        try {
            // a whole lot of rules
            if ((BoardGame.pieceLoc(square).getPlayer().colour != this.colour)
                    && (BoardGame.pieceLoc(square).getType() == PieceType.PAWN)
                    && (BoardGame.pieceLoc(new Square(from.getCol() + movementCol, from.getRow() + movementRow))) == null
                    && (BoardGame.pieceLoc(square).getSinceMoved() == 0)
                    && (BoardGame.pieceLoc(square).getCurrentMove() == 1)
                    && (from.getRow() == enPassantRow))
            {
                return (to.getRow() - from.getRow() == movementRow && to.getCol() - from.getCol() == movementCol);
            }

        } catch (Exception e) {
            // do nothing
        }

        return false;
    }

    private boolean canPawnRegularMove(Square from, Square to) {
        pawnJustCaptured = false;
        // pawn first move
        if (from.getCol() == to.getCol() && BoardGame.pieceLoc(new Square(to.getCol(), to.getRow())) == null) {
            if (BoardGame.pieceLoc(new Square(from.getCol(), from.getRow())).player == this) {
                if (this.colour == 0 && BoardGame.pieceLoc(new Square(from.getCol(), from.getRow())).currentMove == 0)
                    return (to.getRow() - from.getRow() == 2) && isClearVertically(from, to);
                else if (this.colour == 1 && BoardGame.pieceLoc(new Square(from.getCol(), from.getRow())).currentMove == 0)
                    return (from.getRow() - to.getRow() == 2) && isClearVertically(from, to);
                else if (this.colour == 0 && to.getRow() - from.getRow() == 1 && isClearVertically(from, to)) return true;
                else return this.colour == 1 && to.getRow() - from.getRow() == -1 && isClearVertically(from, to);
            }
        }
        // i gotta rewrite this, but you should get the idea
        else if (from.getCol() == to.getCol() - 1 && to.getRow() - from.getRow() == 1 &&
                BoardGame.pieceLoc(new Square(to.getCol(), to.getRow())) != null
                && BoardGame.pieceLoc(new Square(from.getCol(), from.getRow())).player.colour == 0) {
            pawnJustCaptured = true;
            return true;
        }
        else if (from.getCol() == to.getCol() + 1 && to.getRow() - from.getRow() == 1 &&
                BoardGame.pieceLoc(new Square(to.getCol(), to.getRow())) != null &&
                BoardGame.pieceLoc(new Square(from.getCol(), from.getRow())).player.colour == 0) {
            pawnJustCaptured = true;
            return true;
        }
        else if (from.getCol() == to.getCol() - 1 && to.getRow() - from.getRow() == -1 &&
                BoardGame.pieceLoc(new Square(to.getCol(), to.getRow())) != null &&
                BoardGame.pieceLoc(new Square(from.getCol(), from.getRow())).player.colour == 1) {
            pawnJustCaptured = true;
            return true;
        } else if (from.getCol() == to.getCol() + 1 && to.getRow() - from.getRow() == -1 &&
                BoardGame.pieceLoc(new Square(to.getCol(), to.getRow())) != null
                && BoardGame.pieceLoc(new Square(from.getCol(), from.getRow())).player.colour == 1) {
            pawnJustCaptured = true;
            return true;
        }
        return false;
    }

    public boolean canPawnMove(Square from, Square to) {
        return (canPawnRegularMove(from, to) || canEnPassant(from, to));
    }

    public boolean canKnightMove(Square from, Square to) {
        // calculate possible steps
        return Math.abs(from.getCol() - to.getCol()) == 2 && Math.abs(from.getRow() - to.getRow()) == 1
                || Math.abs(from.getCol() - to.getCol()) == 1 && Math.abs(from.getRow() - to.getRow()) == 2;
    }

    public boolean canBishopMove(Square from, Square to) {
        if (Math.abs(from.getCol() - to.getCol()) == Math.abs(from.getRow() - to.getRow())) {
            return isClearDiagonally(from, to);
        }
        return false;
    }

    public boolean canRookMove(Square from, Square to) {
        return from.getCol() == to.getCol() && isClearVertically(from, to) ||
                from.getRow() == to.getRow() && isClearHorizontally(from, to);
    }

    public boolean canQueenMove(Square from, Square to) {
        return canRookMove(from, to) || canBishopMove(from, to);
    }

    public boolean canKingMove(Square from, Square to){
        if(canQueenMove(from, to)) {
            if(canCastleKingSide(from, to)) {
                return true;
            }
            if(canCastleQueenSide(from, to)) {
                return true;
            }
            return Math.abs(from.row - to.row) == 1 &&
                    (Math.abs(from.row - to.row) == 0 || Math.abs(from.row - to.row) == 1) ||
                    Math.abs(from.col - to.col) == 1 &&
                            (Math.abs(from.row - to.row) == 0 || Math.abs(from.row - to.row) == 1);
        }
        return false;
    }

    public boolean canCastleKingSide(Square from, Square to) {
        Square kingSquare;
        ArrayList<ChessPiece> tempPieces;
        if (colour == 0) {
            kingSquare = new Square(4, 0);
            tempPieces = BoardGame.blackPlayer.pieces;
        }
        else {
            kingSquare = new Square(4, 7);
            tempPieces = BoardGame.whitePlayer.pieces;
        }
        try {
            if (BoardGame.pieceLoc(new Square(from.getCol(), from.getRow())).getPlayer() == this) {
                if (BoardGame.pieceLoc(new Square(from.getCol() + 1, from.getRow())) == null
                        && BoardGame.pieceLoc(new Square(from.getCol() + 2, from.getRow())) == null
                        && BoardGame.pieceLoc(new Square(from.getCol() + 3, from.getRow())).getType() == PieceType.ROOK
                        && !BoardGame.pieceLoc(new Square(from.getCol() + 3, from.getRow())).getHasMoved()
                        && BoardGame.pieceLoc(new Square(from.getCol() + 3, from.getRow())).getType() != null
                        && !BoardGame.pieceLoc(kingSquare).getHasMoved()
                        && BoardGame.pieceLoc(kingSquare).getType() == PieceType.KING) {
                        for (ChessPiece p : tempPieces) {
                            try {
                                for (Square s : p.legalSquares) {
                                    if (s.col == from.getCol() && s.row == from.getRow()
                                            || s.col == from.getCol() + 1 && s.row == from.getRow()
                                            || s.col == from.getCol() + 2 && s.row == from.getRow()) {
                                        return false;
                                    }
                                }
                            } catch (Exception eg) {
                                //
                            }
                        }
                    // gotta rework this return, just makes sure that the king moves to the correct space
                    return to.getCol() - from.getCol() > 1;
                }
            }
        } catch (Exception ex) {
            // do a little bit
        }
        return false;
    }

    public boolean canCastleQueenSide(Square from, Square to) {
        Square kingSquare;
        ArrayList<ChessPiece> tempPieces;
        if (colour == 0) {
            kingSquare = new Square(4, 0);
            tempPieces = BoardGame.blackPlayer.pieces;
        }
        else {
            kingSquare = new Square(4, 7);
            tempPieces = BoardGame.whitePlayer.pieces;
        }
        try {
            if (BoardGame.pieceLoc(new Square(from.getCol(), from.getRow())).getPlayer() == this) {
                if (BoardGame.pieceLoc(new Square(from.getCol() - 1, from.getRow())) == null
                        && BoardGame.pieceLoc(new Square(from.getCol() - 2, from.getRow())) == null
                        && BoardGame.pieceLoc(new Square(from.getCol() - 3, from.getRow())) == null
                        && BoardGame.pieceLoc(new Square(from.getCol() - 4, from.getRow())).getType() == PieceType.ROOK
                        && BoardGame.pieceLoc(new Square(from.getCol() - 4, from.getRow())).getType() != null
                        && !BoardGame.pieceLoc(new Square(from.getCol() - 4, from.getRow())).getHasMoved()
                        && !BoardGame.pieceLoc(kingSquare).getHasMoved()
                        && BoardGame.pieceLoc(kingSquare).getType() == PieceType.KING) {
                    for (ChessPiece p : tempPieces) {
                        try {
                            for (Square s : p.legalSquares) {
                                if (s.col == from.getCol() && s.row == from.getRow()
                                        || s.col == from.getCol() - 1 && s.row == from.getRow()
                                        || s.col == from.getCol() - 2 && s.row == from.getRow()
                                        || s.col == from.getCol() - 3 && s.row == from.getRow()) {
                                    return false;
                                }
                            }
                        } catch (Exception eg) {
                            //
                        }
                    }
                    return to.getCol() - from.getCol() < -1;
                }
            }
        } catch (Exception ex) {
            // do a little bit
        }
        return false;
    }

    // isClear methods ensure pieces can't jump over one another
    public boolean isClearVertically(Square from, Square to) {
        if(from.getCol() != to.getCol()) return false;
        int gap = Math.abs(from.getRow() - to.getRow()) - 1;
        if(gap == 0) return true;
        for (int i = 1; i <= gap; i++) {
            int nextRow;
            if (to.getRow() > from.getRow()) nextRow = from.getRow() + i;
            else nextRow = from.getRow() - i;
            if (BoardGame.pieceLoc(new Square(from.getCol(), nextRow)) != null) {
                return false;
            }
        }
        return true;

    }

    public boolean isClearHorizontally(Square from, Square to) {
        if(from.getRow() != to.getRow()) return false;
        int gap = Math.abs(from.getCol() - to.getCol()) - 1;
        if(gap == 0) return true;
        for (int i = 1; i <= gap; i++) {
            int nextCol;
            if (to.getCol() > from.getCol()) nextCol = from.getCol() + i;
            else nextCol = from.getCol() - i;
            if (BoardGame.pieceLoc(new Square(nextCol, from.getRow())) != null) {
                return false;
            }
        }
        return true;
    }

    private boolean isClearDiagonally(Square from, Square to) {
        if (Math.abs(from.getCol() - to.getCol()) != Math.abs(from.getRow() - to.getRow())) return false;
        int gap = Math.abs(from.getCol() - to.getCol()) - 1;
        for (int i = 1; i <= gap; i++) {
            int nextCol, nextRow;
            if (to.getCol() > from.getCol()) nextCol = from.getCol() + i;
            else nextCol = from.getCol() - i;
            if (to.getRow() > from.getRow()) nextRow = from.getRow() + i;
            else nextRow = from.getRow() - i;
            if (BoardGame.pieceLoc(nextCol, nextRow) != null) return false;
        }
        return true;
    }

    public void isKingDiscovered(ChessPiece tempPiece, Square to) {
        LinkedHashSet<Square> opponentDiscoveredSquares = new LinkedHashSet<>();
        ChessPlayer opponent;
        ChessPiece pieceChecking = null;
        int kingRow = 0, kingCol = 0;
        discovered = false;
        boolean possibleCheck = false;
        boolean movedIntoDiscovered = false;

        if (colour == 0) {
            // finds all discovered squares
            for (ChessPiece p : BoardGame.blackPlayer.pieces) {
                opponentDiscoveredSquares.addAll(p.discoveredSquares);
            }
            opponent = BoardGame.blackPlayer;
            for (ChessPiece p : BoardGame.whitePlayer.pieces) {
                if (p.kingID == 1) {
                    kingRow = p.row;
                    kingCol = p.col;
                }
            }
        } else {
            for (ChessPiece p : BoardGame.whitePlayer.pieces) {
                opponentDiscoveredSquares.addAll(p.discoveredSquares);
            }
            opponent = BoardGame.whitePlayer;
            for (ChessPiece p : BoardGame.blackPlayer.pieces) {
                if (p.kingID == 1) {
                    kingRow = p.row;
                    kingCol = p.col;
                }
            }
        }
        for (Square s : opponentDiscoveredSquares) {
            // opponents discovered squares stop at a piece that blocks it, so this works
            if (s.getCol() == kingCol && s.getRow() == kingRow) {
                possibleCheck = true;
                break;
            }
        }
        for (ChessPiece p : opponent.pieces) {
            for (Square s : p.discoveredSquares) {
                // checks squares around king to ensure you can't walk into check
                if (tempPiece.col == s.col && tempPiece.row == s.row && tempPiece.getType() != PieceType.KING) {
                    movedIntoDiscovered = true;
                    pieceChecking = p;
                    break;
                }
            }
        }

        if (movedIntoDiscovered) {
            for (Square s : pieceChecking.discoveredSquares) {
                if (to.col == s.col && to.row == s.row) {
                    movedIntoDiscovered = false;
                    break;
                }
            }
        }

        // idk why this needs two checks but for some reason it won't work otherwise
        if (possibleCheck && movedIntoDiscovered) {
            discovered = true;
        }
    }

    // honestly idk why this isn't a boolean but i'm lazy to change it
    public void isKingChecked(ChessPiece piece, Square to) {
        // initialise where king could be
        int kingRow = 0, kingCol = 0;
        // assume king isn't checked
        checked = false;
        ChessPiece opponentAttackingPiece; // piece that just moved
        ChessPiece attackingKingPiece = null; // for discovered checks
        ArrayList<ChessPiece> opponentPieces;
        if (colour == 0) {
            // find last moved opponent piece
            opponentAttackingPiece = BoardGame.blackPlayer.currentAttackingPiece;
            // finds where piece could move, used for testing scenarios
            opponentAttackingPiece.generateLegalSquares(new Square(opponentAttackingPiece.col, opponentAttackingPiece.row));
            opponentPieces = BoardGame.blackPlayer.pieces;
            for (ChessPiece p : BoardGame.whitePlayer.pieces) {
                if (p.kingID == 1) {
                    // locate king, needs to expand for possible more than one king.
                    kingRow = p.row;
                    kingCol = p.col;
                }
            }
        } else {
            opponentAttackingPiece = BoardGame.whitePlayer.currentAttackingPiece;
            opponentAttackingPiece.generateLegalSquares(new Square(opponentAttackingPiece.col, opponentAttackingPiece.row));
            opponentPieces = BoardGame.whitePlayer.pieces;
            for (ChessPiece p : BoardGame.blackPlayer.pieces) {
                if (p.kingID == 1) {
                    kingRow = p.row;
                    kingCol = p.col;
                }
            }
        }

        for (Square s : opponentAttackingPiece.protectedSquares) {
            // if king lands in seen squares (protected includes any overlap on own pieces,
            // this is to prevent capturing into check
            if (s.getCol() == kingCol && s.getRow() == kingRow) {
                checked = true;
                break;
            }
        }

        for (ChessPiece p : opponentPieces) {
            for (Square s : p.protectedSquares) {
                if (s.col == kingCol && s.row == kingRow) {
                    // for discovered checks
                    if (p != opponentAttackingPiece) {
                        attackingKingPiece = p;
                    }
                    checked = true;
                    break;
                }
            }
        }

        // for non-test discovered check moves
        if (to != null && attackingKingPiece != null) {
            for (Square s : attackingKingPiece.discoveredSquares) {
                if (to.col == s.col && to.row == s.row) {
                    checked = false;
                    break;
                }
            }
            if (!checked) {
                for (Square s : opponentAttackingPiece.protectedSquares) {
                    // in the case of a double check
                    if (s.getCol() == kingCol && s.getRow() == kingRow) {
                        checked = true;
                        break;
                    }
                }
            }
        }

        if (to != null && piece != null) {
            // if attacking piece is captured
            if (to.col == opponentAttackingPiece.col && to.row == opponentAttackingPiece.row
            && attackingKingPiece == null) {
                checked = false;
            }
        }

        if (to != null && piece != null) {
            if (piece.getType() == PieceType.KING) {
                for (ChessPiece p : opponentPieces) {
                    // ensures king can't walk into check
                    for (Square s : p.protectedSquares) {
                        if (to.col == s.col && to.row == s.row) {
                            checked = true;
                            break;
                        } else {
                            checked = false;
                        }
                    }
                }
                if (attackingKingPiece != null) {
                    // ensures king can't move into check after a discovered check
                    for (Square s : attackingKingPiece.protectedSquares) {
                        if (to.col == s.col && to.row == s.row) {
                            checked = true;
                            break;
                        } else {
                            checked = false;
                        }
                    }
                }
            }
        }
    }

    // finds legal moves
    public void findLegalMoves() throws CloneNotSupportedException {
        HashMap<ChessPiece, LinkedHashSet<Square>> legalMoves = new HashMap<>();
        LinkedHashSet<Square> newLegalMoves = new LinkedHashSet<>();
        for (ChessPiece p : pieces) {
            // adds legal moves to hashmap
            legalMoves.put(p, p.legalSquares);
            legalMoves.entrySet().removeIf(ent -> ent.getValue().isEmpty());
        }
        // searches individual pieces
        for (Map.Entry<ChessPiece, LinkedHashSet<Square>> entry : legalMoves.entrySet()) {
            ChessPiece p = entry.getKey();
            LinkedHashSet<Square> legalSquares = entry.getValue();
            // clears hashset
            newLegalMoves.clear();
            for (Square s : legalSquares) {
                // if player can move
                if (movePiece(new Square(p.col, p.row), s, true)) {
                    newLegalMoves.add(s);
                    resetPieces();
                }
            }
            // clears current legal squares and adds all new ones
            p.legalSquares.clear();
            p.legalSquares.addAll(newLegalMoves);
        }
    }

    // check if pieces are able to move, if not don't move them
    public boolean canMove(Square from, Square to){
        boolean pawnMove = false, knightMove = false, bishopMove = false,
                rookMove = false, queenMove = false, kingMove = false;
        try {
            ChessPiece movingPiece = BoardGame.pieceLoc(from);

            // if you attempt to move back to own square, it won't count turn
            if (from.getCol() == to.getCol() && from.getRow() == to.getRow()) {
                return false;
            }
            if (to.getCol() < 0 || to.getCol() > 7 || to.getRow() < 0 || to.getRow() > 7) {
                return false;
            }
            // checks all move sets
            if(movingPiece.moveSet.contains(PieceType.PAWN)
                    && canPawnMove(from, to)) pawnMove = true;
            if(movingPiece.moveSet.contains(PieceType.KNIGHT)
                    && canKnightMove(from, to)) knightMove = true;
            if(movingPiece.moveSet.contains(PieceType.BISHOP)
                    && canBishopMove(from, to)) bishopMove = true;
            if(movingPiece.moveSet.contains(PieceType.ROOK)
                    && canRookMove(from, to)) rookMove = true;
            if(movingPiece.moveSet.contains(PieceType.QUEEN)
                    && canQueenMove(from, to)) queenMove = true;
            if(movingPiece.moveSet.contains(PieceType.KING)
                    && canKingMove(from, to)) kingMove = true;
            return pawnMove || knightMove || bishopMove || rookMove || queenMove || kingMove;
        } catch  (Exception ex) {
            //
        }
        return false;
    }


    public boolean movePiece(Square from, Square to, boolean testMove) throws CloneNotSupportedException {
        // for pgn testing
        castled = 0;
        String currentPgn = BoardGame.pgnMoves.toString();
        int currentGameMove = BoardGame.gameMove;
        // gets current piece trying to move
        ChessPiece tempPiece;
        tempPiece = BoardGame.pieceLoc(from);

        // if in moveset
        if (canMove(from, to) && turn) {
            // for test moves
            clearTempPieces();
            if (movePiece(from.getCol(), from.getRow(), to.getCol(), to.getRow(), testMove)) {
                // ensures the attacking piece isn't null
                if (colour == 0 && BoardGame.gameMove > 2) {
                    isKingDiscovered(tempPiece, to);
                    isKingChecked(tempPiece, to);
                }
                else if (colour == 1 && BoardGame.gameMove > 1) {
                    isKingDiscovered(tempPiece, to);
                    isKingChecked(tempPiece, to);
                }
                if (checked || discovered) {
                    // reset temp pieces (for testing)
                    resetPieces();
                    BoardGame.pgnMoves.setLength(0);
                    BoardGame.gameMove = currentGameMove;
                    BoardGame.pgnMoves.append(currentPgn);
                    return false;
                } else {
                    return true;
                }
            }
        }
        return false;
    }

    boolean movePiece(int fromCol, int fromRow, int toCol, int toRow, boolean testMove) throws CloneNotSupportedException {

        // gets size of pieces (check if move is a capture for sfx and pgn)
        int piecesSize;

        if (fromCol == toCol && fromRow == toRow) return false;
        // get pieces
        ChessPiece movingPiece = BoardGame.pieceLoc(fromCol, fromRow);
        ChessPiece removePiece = BoardGame.pieceLoc(toCol, toRow);

        captureMove = false;
        ArrayList<ChessPiece> tempPieces;

        // gets opponent pieces
        if (colour == 0) tempPieces = BoardGame.blackPlayer.pieces;
        else tempPieces = BoardGame.whitePlayer.pieces;

        // gets opponent pieces size
        piecesSize = tempPieces.size();

        if (movingPiece.player == this) {
            try {
                // players can't capture their own pieces
                if (movingPiece.player == removePiece.player) {
                    return false;
                }
            } catch (Exception ex) {
                // do nothing
            }
            // removes pieces from board
            BoardGame.whitePlayer.pieces.remove(removePiece);
            BoardGame.whitePlayer.pieces.remove(movingPiece);
            BoardGame.blackPlayer.pieces.remove(removePiece);
            BoardGame.blackPlayer.pieces.remove(movingPiece);

            // clones piece so it retains attributes (such as moved/not)
            ChessPiece tempPiece = (ChessPiece) movingPiece.clone();

            // sets attributes of cloned piece
            tempPiece.col = toCol;
            tempPiece.row = toRow;
            tempPiece.currentMove += 1;
            pieces.add(tempPiece);


            if (tempPiece.type == PieceType.KING && toCol - fromCol > 1 && !testMove) {
                if (this.colour == 0 && !tempPiece.getHasMoved()) {
                    movePiece(tempPiece.col, tempPiece.row, 7, 0, true);
                    movePiece(7, 0, 5, 0, true); // moves rook for kingside
                    castled = 1;
                }
                if (this.colour == 1 && !tempPiece.getHasMoved()) {
                    movePiece(tempPiece.col, tempPiece.row, 7, 7, true);
                    movePiece(7, 7, 5, 7, true);
                    castled = 1;
                }
            }
            if (tempPiece.type == PieceType.KING && toCol - fromCol < -1 && !testMove) {
                if (this.colour == 0 && !tempPiece.getHasMoved()) {
                    movePiece(tempPiece.col, tempPiece.row, 2, 0, true);
                    movePiece(0, 0, 3, 0, true); // moves rook for queenside
                    castled = 2;
                }
                if (this.colour == 1 && !tempPiece.getHasMoved()) {
                    movePiece(tempPiece.col, tempPiece.row, 2, 7, true);
                    movePiece(0, 7, 3, 7, true);
                    castled = 2; // queenside
                }
            }

            tempPiece.hasMoved = true;

            for (ChessPiece p : BoardGame.whitePlayer.pieces) {
                if (p.getType() == PieceType.PAWN && p.getCurrentMove() == 1) {
                    // en passant stuff
                    if (!testMove) p.addSinceMoved(1);
                }
            }
            for (ChessPiece p : BoardGame.blackPlayer.pieces) {
                if (p.getType() == PieceType.PAWN && p.getCurrentMove() == 1) {
                    if (!testMove) p.addSinceMoved(1);
                }
            }

            try {
                // en passant check to remove captured piece. ugh
                if (tempPiece.type == PieceType.PAWN && Math.abs(toCol - fromCol) == 1 && toRow - fromRow == 1 && !testMove
                        && BoardGame.pieceLoc(toCol, fromRow).getType() == PieceType.PAWN
                        && BoardGame.pieceLoc(toCol,fromRow).getPlayer().colour != colour && !pawnJustCaptured) {
                    ChessPiece removeEnPassant = BoardGame.pieceLoc(toCol, fromRow);
                    BoardGame.whitePlayer.pieces.remove(removeEnPassant);
                    BoardGame.blackPlayer.pieces.remove(removeEnPassant);
                }
            } catch (Exception ex) {
                //
            }

            try {
                if (tempPiece.type == PieceType.PAWN && Math.abs(toCol - fromCol) == 1 && toRow - fromRow == -1 && !testMove
                        && BoardGame.pieceLoc(toCol, fromRow).getType() == PieceType.PAWN &&
                        BoardGame.pieceLoc(toCol,fromRow).getPlayer().colour != colour && !pawnJustCaptured) {
                    ChessPiece removeEnPassant = BoardGame.pieceLoc(toCol, fromRow);
                    BoardGame.whitePlayer.pieces.remove(removeEnPassant);
                    BoardGame.blackPlayer.pieces.remove(removeEnPassant);
                }
            } catch (Exception ex) {
                //
            }

            // promotion (only to queen currently)
            if (tempPiece.getType() == PieceType.PAWN && tempPiece.getPlayer().colour == 0 && toRow == 7) {
                tempPiece.setPieceType(PieceType.QUEEN);
                tempPiece.moveSet = BoardGame.queenMoveSet;
                tempPiece.setResId(R.drawable.wq);
            }

            if (tempPiece.getType() == PieceType.PAWN && tempPiece.getPlayer().colour == 1 && toRow == 0) {
                tempPiece.setPieceType(PieceType.QUEEN);
                tempPiece.moveSet = BoardGame.queenMoveSet;
                tempPiece.setResId(R.drawable.bq);
            }

            // calculates new pieces size
            int newPiecesSize = tempPieces.size();

            if (piecesSize > newPiecesSize && !testMove) {
                captureMove = true;
            }

            if (!testMove) {
                BoardGame.gameMove++;
                currentAttackingPiece = tempPiece;
                // writes to pgn
                addToPgn(new Square(fromCol, fromRow), new Square(toCol, toRow), tempPiece.getType(), tempPiece, captureMove, castled);
            }
            return true;
        }
        return false;
    }

    public void resetPieces() {
        BoardGame.whitePlayer.pieces.clear();
        BoardGame.blackPlayer.pieces.clear();
        BoardGame.whitePlayer.pieces.addAll(tempWhitePieces);
        BoardGame.blackPlayer.pieces.addAll(tempBlackPieces);
    }

    public void clearTempPieces() {
        tempWhitePieces.clear();
        tempBlackPieces.clear();
        tempWhitePieces.addAll(BoardGame.whitePlayer.pieces);
        tempBlackPieces.addAll(BoardGame.blackPlayer.pieces);
    }

    public void addToPgn(Square from, Square to, PieceType type, ChessPiece piece, boolean capture, int castled) {
        boolean overlap = false;
        ArrayList<ChessPiece> typePieces = new ArrayList<>();
        ArrayList<Square> overlapMoves = new ArrayList<>();

        if (type == PieceType.KNIGHT || type == PieceType.ROOK) {
            for (ChessPiece p : pieces) {
                typePieces.add(p.getPiecesOfType(type, piece));
            }
        }

        for (ChessPiece p : typePieces) {
            if (p != null) {
                // if there are any shared squares between pieces (rooks / knights), make sure to
                // specify which piece is being moved (e.g. Rhh4)
                overlapMoves.addAll(p.legalSquares);
            }
        }

        typePieces.removeAll(Collections.singleton(null));

        if (BoardGame.gameMove % 2 == 0) {
            if (BoardGame.pgnMoves.length() > 0) BoardGame.pgnMoves.append(" ");
            BoardGame.pgnMoves.append(Math.round((float) BoardGame.gameMove / 2)).append(".");
        }

        if (type == PieceType.PAWN) {
            BoardGame.pgnMoves.append(" ");
            BoardGame.pgnMoves.append(from.getValToString(from.getCol()).toLowerCase());

            if ((piece.moveSet.contains(PieceType.KNIGHT) || piece.moveSet.contains(PieceType.BISHOP)
            || piece.moveSet.contains(PieceType.ROOK) || piece.moveSet.contains(PieceType.QUEEN)
            || piece.moveSet.contains(PieceType.KING)) && to.getCol() != from.getCol()) {
                if (capture)
                    BoardGame.pgnMoves.append("x").append(to.getValToString(to.getCol()).toLowerCase());
                else {
                    BoardGame.pgnMoves.append(to.getValToString(to.getCol()).toLowerCase());
                }
            } else{
                if (capture)
                    BoardGame.pgnMoves.append("x").append(to.getValToString(to.getCol()).toLowerCase());
            }
            BoardGame.pgnMoves.append(to.getRow() + 1);
            BoardGame.whitePlayer.sincePawnMoved = 0;
            BoardGame.blackPlayer.sincePawnMoved = 0;
        } else {
            sincePawnMoved++;
        }

        if (type == PieceType.KNIGHT) {
            BoardGame.pgnMoves.append(" ");
            BoardGame.pgnMoves.append("N");
            for (Square s : overlapMoves) {
                if (to.getCol() == s.getCol() && to.getRow() == s.getRow()) {
                    overlap = true;
                    break;
                }
            }
            if (overlap) {
                if (capture) BoardGame.pgnMoves.append("x");
                else BoardGame.pgnMoves.append(from.getValToString(to.getCol()).toLowerCase()); // g
            }
            if (capture) BoardGame.pgnMoves.append("x");
            BoardGame.pgnMoves.append(from.getValToString(to.getCol()).toLowerCase()).append(to.getRow() + 1);
        }

        if (type == PieceType.BISHOP) {
            BoardGame.pgnMoves.append(" ").append("B");
            if (capture) BoardGame.pgnMoves.append("x");
            BoardGame.pgnMoves.append(from.getValToString(to.getCol()).toLowerCase()).append(to.getRow() + 1);
        }

        if (type == PieceType.ROOK) {
            BoardGame.pgnMoves.append(" ");
            BoardGame.pgnMoves.append("R");
            for (Square s : overlapMoves) {
                if (to.getCol() == s.getCol() && to.getRow() == s.getRow()) {
                    overlap = true;
                    break;
                }
            }
            if (overlap) {
                if (capture) BoardGame.pgnMoves.append("x");
                else BoardGame.pgnMoves.append(from.getValToString(to.getCol()).toLowerCase()); // g
            }
            if (capture) BoardGame.pgnMoves.append("x");
            BoardGame.pgnMoves.append(from.getValToString(to.getCol()).toLowerCase());
            BoardGame.pgnMoves.append(to.getRow() + 1);
        }

        if (type == PieceType.QUEEN) {
            BoardGame.pgnMoves.append(" ").append("Q");
            if (capture) BoardGame.pgnMoves.append("x");
            BoardGame.pgnMoves.append(from.getValToString(to.getCol()).toLowerCase()).append(to.getRow() + 1);
        }

        if (type == PieceType.KING) {
            BoardGame.pgnMoves.append(" ");
            if (castled == 1) BoardGame.pgnMoves.append("O-O");
            else if (castled == 2) BoardGame.pgnMoves.append("O-O-O");
            else {
                BoardGame.pgnMoves.append("K");
                if (capture) BoardGame.pgnMoves.append("x");
                BoardGame.pgnMoves.append(from.getValToString(to.getCol()).toLowerCase()).append(to.getRow() + 1);
            }
        }
        BoardGame.pgnCheck.add(BoardGame.pgnBoard());
    }

    public int getSincePawnMoved() {
        return this.sincePawnMoved;
    }

    public int getSinceCaptured() {
        return this.sinceCaptured;
    }
}
