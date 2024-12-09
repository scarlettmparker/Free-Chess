#include <cmath>
#include <unordered_map>
#include "generator.hpp"
#include "legal.hpp"

enum { white, black, both };

namespace move {
  int concat(int num1, int num2) {
    int num2_digs = std::log10(num2) + 1;
    return num1 * std::pow(10, num2_digs) + num2;
  }

  int encode_move(int source, int target, int piece, int promoted, int capture, int double_move, int enpassant, int castle) {
    return source | (target << 6) | (piece << 12) | (promoted << 16) | (capture << 20) | (double_move << 21) | (enpassant << 22) | (castle << 23);
  }

  int get_check_move(piece::Piece piece, int source_square) {
    int piece_move_length = piece.get_leaper_offsets().size;
    std::unordered_map<int, int> piece_moves = piece.get_color() == white
      ? generator::gamestate.white_moves : generator::gamestate.black_moves;

    int leaper = piece.get_leaper();
    if (leaper == 0) return 0;

    auto check_move_iter = piece_moves.find(concat(source_square, piece.get_id()));
    if (check_move_iter == piece_moves.end()) return 0;

    int check_move = check_move_iter->second;
    if (piece.get_rotational_move_type() == 1) {
      check_move = check_move % piece_move_length;
    } else if (piece.get_rotational_move_type() == 2) {
      /*
        let reverse_piece = piece as PogoPiece;
        let piece_direction = reverse_piece.reverse.get(source_square) || 0;
        const offsets = (piece_direction * (piece_move_length / 2));
        check_move = offset + ((current_move % piece_move_length) % (piece_move_length) / 2);
      */
      check_move = 0;
    }

    return check_move;
  }

  void add_move(legal::MoveList moves, int move) {
    moves.moves[moves.count] = move;
    moves.count++;
  }

  inline int get_move_source(int move) { return move & 0x3f; }
  inline int get_move_target(int move) { return (move & 0xfc0) >> 6; }
  inline int get_move_piece(int move) { return (move & 0xf000) >> 12; }
  inline int get_move_promoted(int move) { return (move & 0xf0000) >> 16; }
  inline int get_move_capture(int move) { return (move & 0x100000); }
  inline int get_move_double(int move) { return (move & 0x200000); }
  inline int get_move_enpassant(int move) { return (move & 0x400000); }
  inline int get_move_castle(int move) { return (move & 0x800000); }
}