#ifndef INCLUDED_LEGAL
#define INCLUDED_LEGAL

#include "piece.hpp"

namespace legal {
  struct MoveList {int moves[256]; int count; };
  piece::Piece * find_pieces_by_color(piece::Piece * pieces, int num_pieces, int color);
  int square_attacked(int pos, int side, int num_pieces);
  void generate_move(MoveList moves, piece::Piece piece, int num_pieces);
  void generate_moves(MoveList moves, piece::Piece * pieces, int num_pieces);
}

#endif