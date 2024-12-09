#ifndef INCLUDED_MOVE
#define INCLUDED_MOVE

#include <unordered_map>
#include "piece.hpp"
#include "legal.hpp"

namespace move {
  int concat(int num1, int num2);
  int encode_move(int source, int target, int piece, int promoted, int capture, int double_move, int enpassant, int castle);
  int get_check_move(piece::Piece piece, int source_square);
  void add_move(legal::MoveList moves, int move);
  
  inline int get_move_source(int move);
  inline int get_move_target(int move);
  inline int get_move_piece(int move);
  inline int get_move_promoted(int move);
  inline int get_move_capture(int move);
  inline int get_move_double(int move);
  inline int get_move_enpassant(int move);
  inline int get_move_castle(int move);
}

#endif