package com.scarwe.freechess.activity;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.Button;

import com.scarwe.freechess.game.BoardGame;
import com.scarwe.freechess.game.BoardView;
import com.scarwe.freechess.game.ChessDelegate;
import com.scarwe.freechess.game.ChessPiece;
import com.scarwe.freechess.game.ChessPlayer;
import com.scarwe.freechess.R;
import com.scarwe.freechess.game.PieceType;
import com.scarwe.freechess.game.Square;
import java.util.Collections;

public class ChessActivity extends Activity implements ChessDelegate {

    private final int bgColor = Color.parseColor("#252525");
    private int gameState = 0;

    ChessPlayer white = BoardGame.whitePlayer;
    ChessPlayer black = BoardGame.blackPlayer;

    MediaPlayer player = new MediaPlayer();

    @SuppressLint({"SourceLockedOrientationActivity", "SetTextI18n"})
    @Override
    public void onCreate(Bundle savedInstanceState) {
        player = MediaPlayer.create(this, R.raw.start);
        player.start();
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chess);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        Button whiteResign = findViewById(R.id.white_resign_button);
        Button blackResign = findViewById(R.id.black_resign_button);

        // finds the board view by its ID
        BoardView boardView = findViewById(R.id.board_view);
        boardView.chessDelegate = this;

        setActivityBgColor();

        whiteResign.setOnClickListener(v -> {
            if (whiteResign.getText().toString().equalsIgnoreCase("resign")) {
                whiteResign.setText("Are you sure?");
                // changes text back after 3 seconds
                new Handler(Looper.getMainLooper()).postDelayed(() -> whiteResign.setText("Resign"), 3000);
            } else {
                viewEndScreen(6, "Black");
            }
        });

        blackResign.setOnClickListener(v -> {
            if (blackResign.getText().toString().equalsIgnoreCase("resign")) {
                blackResign.setText("Are you sure?");
                new Handler(Looper.getMainLooper()).postDelayed(() -> whiteResign.setText("Resign"), 3000);
            } else {
                viewEndScreen(6, "White");
            }
        });

        player = MediaPlayer.create(this, R.raw.move);

    }

    // required due to interface
    @Override
    public ChessPiece pieceLoc(Square square) {
        return BoardGame.pieceLoc(square);
    }

    @Override
    public void movePiece(Square from, Square to) throws CloneNotSupportedException {
        // automatically true and checked if false, easier to check this way
        boolean checkmated = true;
        boolean stalemated = true;
        boolean drawByRepetition = false;
        boolean insufficientMaterial;
        boolean fiftyMoveRule = false;

        int count = 0;

        // if whites turn and game playable
        // for pop up when winning
        String winner = "";
        if (white.turn && gameState == 0) {
            // for capture moves
            int piecesSize = BoardGame.blackPlayer.pieces.size();
            // if can move piece
            if (BoardGame.whitePlayer.movePiece(from, to, false)) {
                for (ChessPiece p : BoardGame.whitePlayer.pieces) {
                    if (p.getType() == PieceType.KING && !BoardGame.whitePlayer.checked) {
                        p.resID = R.drawable.wk;
                        break;
                    }
                }
                int newPiecesSize = BoardGame.blackPlayer.pieces.size();
                BoardGame.setCurrentPlayer(BoardGame.blackPlayer);

                // ensures correct turn turn
                BoardGame.whitePlayer.setTurn(false);
                BoardGame.blackPlayer.setTurn(true);

                if (piecesSize == newPiecesSize) {
                    player = MediaPlayer.create(this, R.raw.move);
                    player.start();
                    white.sinceCaptured++;
                } else {
                    player = MediaPlayer.create(this, R.raw.capture);
                    player.start();
                    white.sinceCaptured = 0;
                    black.sinceCaptured = 0;
                }
                white.piecesDiscovered = 0;
                black.piecesDiscovered = 0;
                // find legal moves for players
                for (ChessPiece p : white.pieces) {
                    p.pieceHasChecked = false;
                }
                for (ChessPiece p : black.pieces) {
                    p.pieceHasChecked = false;
                }

                for (ChessPiece p : white.pieces) {
                    p.generateLegalSquares(new Square(p.col, p.row));

                    if (p.discoveredSquares.size() > 0 && !p.pieceHasChecked) {
                        white.piecesDiscovered++;
                        p.pieceHasChecked = true;
                    }
                }

                for (ChessPiece p : black.pieces) {
                    p.generateLegalSquares(new Square(p.col, p.row));

                    if (p.discoveredSquares.size() > 0 && !p.pieceHasChecked) {
                        black.piecesDiscovered++;
                        p.pieceHasChecked = true;
                    }
                }

                black.findLegalMoves();
                if (BoardGame.gameMove > 3) black.isKingChecked(null, null);

                // see if current state has been repeated
                for (String s : BoardGame.getPgn()) count = Collections.frequency(BoardGame.getPgn(), s);
                if (count > 2) drawByRepetition = true;

                if (drawByRepetition) {
                    // will probably make a button to claim a draw at some point, instead of automatic
                    gameState = 3;
                    winner = "Draw";
                    System.out.println("draw by repetition");
                    viewEndScreen(gameState, winner);
                    BoardGame.pgnMoves.append(" 1-2/1-2");
                }

                insufficientMaterial = checkInsufficient();
                if (white.pieces.size() == 1 && black.pieces.size() == 1) insufficientMaterial = true;

                if (insufficientMaterial) {
                    gameState = 4;
                    winner = "Draw";
                    System.out.println("draw by insufficient material");
                    viewEndScreen(gameState, winner);
                    BoardGame.pgnMoves.append(" 1-2/1-2");
                }

                if (white.getSincePawnMoved() > 49 && white.getSinceCaptured() > 49
                        && black.getSincePawnMoved() > 49 && black.getSinceCaptured() > 49) {
                    fiftyMoveRule = true;
                }

                if (fiftyMoveRule) {
                    gameState = 5;
                    winner = "Draw";
                    System.out.println("fifty move rule reached");
                    viewEndScreen(gameState, winner);
                    BoardGame.pgnMoves.append(" 1-2/1-2");
                }

                if (black.checked) {
                    System.out.println("black checked");
                    for (ChessPiece p : black.pieces) {
                        if (p.getType() == PieceType.KING) {
                            p.resID = R.drawable.cbk;
                        }
                        // if there are any legal moves, checkmated is false
                        if (p.legalSquares.size() != 0) {
                            checkmated = false;
                        }
                    }
                    if (checkmated) {
                        gameState = 1;
                        winner = "White";
                        BoardGame.pgnMoves.append("# 1-0");
                        System.out.println("black checkmated");
                        viewEndScreen(gameState, winner);
                    } else {
                        BoardGame.pgnMoves.append("+");
                    }
                } else {
                    for (ChessPiece p : black.pieces) {
                        // if not in check and there are legal moves
                        if (p.legalSquares.size() != 0) {
                            stalemated = false;
                            break;
                        }
                    }
                    if (stalemated) {
                        gameState = 2;
                        winner = "Draw";
                        System.out.println("black stalemated");
                        BoardGame.pgnMoves.append(" 1-2/1-2");
                        viewEndScreen(2, winner);
                    }
                }
            }
            // everything the same for black, should probably simplify this at some point
        } else if (BoardGame.blackPlayer.turn && gameState == 0) {
            int piecesSize = BoardGame.whitePlayer.pieces.size();
            if (BoardGame.blackPlayer.movePiece(from, to, false)) {
                for (ChessPiece p : BoardGame.blackPlayer.pieces) {
                    if (p.getType() == PieceType.KING && !BoardGame.blackPlayer.checked) {
                        p.resID = R.drawable.bk;
                        break;
                    }
                }
                int newPiecesSize = BoardGame.whitePlayer.pieces.size();
                BoardGame.setCurrentPlayer(BoardGame.whitePlayer);
                BoardGame.whitePlayer.setTurn(true);
                BoardGame.blackPlayer.setTurn(false);

                if (piecesSize == newPiecesSize) {
                    player = MediaPlayer.create(this, R.raw.move);
                    player.start();
                    black.sinceCaptured++;
                } else {
                    player = MediaPlayer.create(this, R.raw.capture);
                    player.start();
                    white.sinceCaptured = 0;
                    black.sinceCaptured = 0;
                }

                white.piecesDiscovered = 0;
                black.piecesDiscovered = 0;

                for (ChessPiece p : white.pieces) {
                    p.pieceHasChecked = false;
                }
                for (ChessPiece p : black.pieces) {
                    p.pieceHasChecked = false;
                }

                for (ChessPiece p : white.pieces) {
                    p.generateLegalSquares(new Square(p.col, p.row));

                    if (p.discoveredSquares.size() > 0 && !p.pieceHasChecked) {
                        white.piecesDiscovered++;
                        p.pieceHasChecked = true;
                    }
                }

                for (ChessPiece p : black.pieces) {
                    p.generateLegalSquares(new Square(p.col, p.row));

                    if (p.discoveredSquares.size() > 0 && !p.pieceHasChecked) {
                        black.piecesDiscovered++;
                        p.pieceHasChecked = true;
                    }
                }

                white.findLegalMoves();
                if (BoardGame.gameMove > 3) white.isKingChecked(null, null);

                for (String s : BoardGame.getPgn()) count = Collections.frequency(BoardGame.getPgn(), s);
                if (count > 2) drawByRepetition = true;

                insufficientMaterial = checkInsufficient();
                if (white.pieces.size() == 1 && black.pieces.size() == 1) insufficientMaterial = true;

                if (insufficientMaterial) {
                    gameState = 4;
                    winner = "Draw";
                    System.out.println("draw by insufficient material");
                    viewEndScreen(gameState, winner);
                    BoardGame.pgnMoves.append(" 1-2/1-2");
                }

                if (drawByRepetition) {
                    gameState = 3;
                    winner = "Draw";
                    System.out.println("draw by repetition");
                    viewEndScreen(gameState, winner);
                    BoardGame.pgnMoves.append(" 1-2/1-2");
                }

                if (white.getSincePawnMoved() > 49 && white.getSinceCaptured() > 49
                        && black.getSincePawnMoved() > 49 && black.getSinceCaptured() > 49) {
                    fiftyMoveRule = true;
                }

                if (fiftyMoveRule) {
                    gameState = 5;
                    winner = "Draw";
                    System.out.println("fifty move rule reached");
                    viewEndScreen(gameState, winner);
                    BoardGame.pgnMoves.append(" 1-2/1-2");
                }

                if (white.checked) {
                    System.out.println("white checked");
                    for (ChessPiece p : white.pieces) {
                        if (p.getType() == PieceType.KING) {
                            p.resID = R.drawable.cwk;
                        }
                        if (p.legalSquares.size() != 0) {
                            checkmated = false;
                        }
                    }
                    if (checkmated) {
                        gameState = 1;
                        winner = "Black";
                        System.out.println("white checkmated");
                        BoardGame.pgnMoves.append("# 0-1");
                        viewEndScreen(gameState, winner);
                    } else {
                        BoardGame.pgnMoves.append("+");
                    }
                } else {
                    for (ChessPiece p : white.pieces) {
                        if (p.legalSquares.size() != 0) {
                            stalemated = false;
                            break;
                        }
                    }
                    if (stalemated) {
                        gameState = 2;
                        winner = "Draw";
                        System.out.println("white stalemated");
                        BoardGame.pgnMoves.append(" 1-2/1-2");
                        viewEndScreen(gameState, winner);
                    }
                }
            }
        }
        System.out.println(BoardGame.pgnMoves);
        findViewById(R.id.board_view).invalidate();
        if (gameState != 0) {
            System.out.println("game end");
        }
    }

    // set background colour
    private void setActivityBgColor() {
        View view = this.getWindow().getDecorView();
        view.setBackgroundColor(bgColor);
    }

    // find insufficient material
    private boolean checkInsufficient() {
        if (white.pieces.size() < 3 && black.pieces.size() < 3) {
            for (ChessPiece p : white.pieces) {
                if (p.getType() == PieceType.KNIGHT) {
                    return true;
                }
                if (p.getType() == PieceType.BISHOP) {
                    for (ChessPiece b : black.pieces) {
                        if (b.getType() == PieceType.BISHOP && b.getBishopColour() != p.getBishopColour()) {
                            return true;
                        }
                    }
                }
            }
            for (ChessPiece p : white.pieces) {
                if (p.getType() == PieceType.KNIGHT) {
                    return true;
                }
                if (p.getType() == PieceType.BISHOP) {
                    for (ChessPiece b : black.pieces) {
                        if (b.getType() == PieceType.BISHOP && b.getBishopColour() != p.getBishopColour()) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    private void viewEndScreen(int gameState, String winner) {
        player = MediaPlayer.create(this, R.raw.game_end);
        player.start();
        Intent endScreen = new Intent(ChessActivity.this, EndScreenActivity.class);
        EndScreenActivity.gameState = gameState;
        EndScreenActivity.winner = winner;
        startActivity(endScreen);
        finish();
    }
}