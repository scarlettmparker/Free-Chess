#include "legal.hpp"
#include "move.hpp"
#include "piece.hpp"
#include "generator.hpp"

#include <stdint.h>
#include <cstdlib>

enum {
    a8, b8, c8, d8, e8, f8, g8, h8,
    a7, b7, c7, d7, e7, f7, g7, h7,
    a6, b6, c6, d6, e6, f6, g6, h6,
    a5, b5, c5, d5, e5, f5, g5, h5,
    a4, b4, c4, d4, e4, f4, g4, h4,
    a3, b3, c3, d3, e3, f3, g3, h3,
    a2, b2, c2, d2, e2, f2, g2, h2,
    a1, b1, c1, d1, e1, f1, g1, h1, no_sq
};

enum { white, black, both };
enum { wk = 1, wq = 2, bk = 4, bq = 8};

namespace legal {
  piece::Piece * find_pieces_by_color(piece::Piece * pieces, int num_pieces, int color, int * out_count) {
    int count = 0;
    for (int i = 0; i < num_pieces; i++) {
      if (pieces[i].get_color() == color) count++;
    }

    if (count == 0) {
      *out_count = 0;
      return NULL;
    }

    piece::Piece * filtered_pieces = (piece::Piece *)malloc(count * sizeof(piece::Piece));
    if (filtered_pieces == NULL) exit(1);

    int j = 0;
    for (int i = 0; i < num_pieces; i++) {
      if (pieces[i].get_color() == color) {
        filtered_pieces[j] = pieces[i];
        j++;
      }
    }

    *out_count = count;
    return filtered_pieces;
  }

  int square_attacked(int pos, int side, int num_pieces) {
    if (pos == no_sq) return 0;
    int filtered_count = 0;
    piece::Piece * filtered_pieces = find_pieces_by_color(generator::gamestate.pieces, num_pieces, 0, &filtered_count);

    if (filtered_pieces == NULL) return 0;
    for (int i = 0; i < filtered_count; i++) {
      piece::Piece piece = filtered_pieces[i];
      int piece_id = piece.get_id();
      uint64_t bitboard = generator::get_bitboard(piece_id).bitboard;

      int color = piece.get_color();
      int pawn = piece.get_pawn();
      int slider = piece.get_slider();
      int leaper = piece.get_leaper();

      if (pawn != 0) {
        if (piece.get_pawn_piece_state()[color ^ 1][pos] & bitboard) return 0;
      }

      if (slider != 0) {
        if (piece.get_sliding_piece_attacks(pos, generator::gamestate.occupancies[both],
          piece.get_straight_constraints(), piece.get_diagonal_constraints()) & bitboard) return 1;
      }

      if (leaper != 0) {
        int check_move = 0;
        int checked = 0;

        while (bitboard) {
          int source_square = generator::get_lsfb_index(bitboard);
          check_move = move::get_check_move(piece, source_square);

          if (check_move && check_move > 0) {
            checked = 1;
            if (piece.get_leaper_piece_state()[color ^ 1][check_move][pos] & bitboard) return 1;
          }

          bitboard &= ~(1 << source_square);
        }

        if (!check_move && !checked) {
          if (piece.get_leaper_piece_state()[color ^ 1][check_move][pos] & bitboard) return 1;
        }
      }
    }

    free(filtered_pieces);
    return 0;
  }

  void generate_move(MoveList moves, piece::Piece piece, int num_pieces) {
    int target_square, source_square;
    uint64_t bitboard, attacks;
    bitboard = generator::get_bitboard(piece.get_id()).bitboard;

    int id = piece.get_id();
    int color = piece.get_color();
    int pawn = piece.get_pawn();
    int promote = piece.get_promote();
    int enpassant = piece.get_enpassant();

    if (color == white && pawn != 0) {
      while (bitboard) {
        source_square = generator::get_lsfb_index(bitboard);
        target_square = source_square - 8;
        if (!(target_square < a8) && !generator::get_bit(generator::gamestate.occupancies[both], target_square)) {
          if (source_square >= a7 && source_square <= h7) {
            /* PAWN: PROMOTION */
            if (promote != 0) {
              for (int i = 0; i < generator::white_promotions.size(); i++) {
                int promote_piece = generator::white_promotions[i];
                move::add_move(moves, move::encode_move(source_square, target_square, id, promote_piece, 0, 0, 0, 0));
              }
            }
          } else {
            /* PAWN: ONE SQUARE PUSH */
            move::add_move(moves, move::encode_move(source_square, target_square, id, 0, 0, 0, 0, 0));
            if ((source_square >= a2 && source_square <= h2) && !generator::get_bit(
              generator::gamestate.occupancies[both], target_square - 8)
            ) {
              move::add_move(moves, move::encode_move(source_square, target_square - 8, id, 0, 0, 1, 0, 0));
            }
          }
        }

        attacks = piece.get_pawn_piece_state()[generator::gamestate.side][source_square] & generator::gamestate.occupancies[black];
        while (attacks) {
          target_square = generator::get_lsfb_index(attacks);
          if (source_square >= a7 && source_square <= h7) {
            /* PAWN: CAPTURE PROMOTION */
            if (promote != 0) {
              for (int i = 0; i < generator::white_promotions.size(); i++) {
                int promote_piece = generator::white_promotions[i];
                move::add_move(moves, move::encode_move(source_square, target_square, id, promote_piece, 1, 0, 0, 0));
              }
            }
          } else {
            /* PAWN: REGULAR CAPTURE */
            move::add_move(moves, move::encode_move(source_square, target_square, id, 0, 1, 0, 0, 0));
          }
          generator::pop_bit(attacks, target_square);
        }

        if (generator::gamestate.enpassant != no_sq) {
          uint64_t enpassant_attacks = piece.get_pawn_piece_state()[generator::gamestate.side][source_square] & (1 << generator::gamestate.enpassant);
          if (enpassant_attacks) {
            int target_enpassant = generator::get_lsfb_index(enpassant_attacks);
            move::add_move(moves, move::encode_move(source_square, target_enpassant, id, 0, 1, 0, 1, 0));
          }
        }

        generator::pop_bit(bitboard, source_square);
      }
    }

    int king = piece.get_king();
    if (color == white && king != 0) {
      /* WHITE KING SIDE CASTLE */
      if (generator::gamestate.castle & wk) {
        if (!generator::get_bit(generator::gamestate.occupancies[both], f1) && !generator::get_bit(
          generator::gamestate.occupancies[both], g1)
        ) {
          if (!square_attacked(e1, black, num_pieces) && !square_attacked(f1, black, num_pieces)) {
            move::add_move(moves, move::encode_move(e1, g1, id, 0, 0, 0, 0, 1));
          }
        }
      }
      
      /* WHITE QUEEN SIDE CASTLE */
      if (generator::gamestate.castle & wq) {
        if (!generator::get_bit(generator::gamestate.occupancies[both], d1) && !generator::get_bit(
          generator::gamestate.occupancies[both], c1) && !generator::get_bit(generator::gamestate.occupancies[both], b1)
        ) {
          if (!square_attacked(e1, black, num_pieces) && !square_attacked(d1, black, num_pieces)) {
            move::add_move(moves, move::encode_move(e1, c1, id, 0, 0, 0, 0, 1));
          }
        }
      }
    }

    if (color == black && pawn != 0) {
      while (bitboard) {
        source_square = generator::get_lsfb_index(bitboard);
        target_square = source_square + 8;
        if (!(target_square > h1) && !generator::get_bit(generator::gamestate.occupancies[both], target_square)) {
          if (source_square >= a2 && source_square <= h2) {
            /* PAWN: PROMOTION */
            if (promote != 0) {
              for (int i = 0; i < generator::black_promotions.size(); i++) {
                int promote_piece = generator::black_promotions[i];
                move::add_move(moves, move::encode_move(source_square, target_square, id, promote_piece, 0, 0, 0, 0));
              }
            }
          } else {
            /* PAWN: ONE SQUARE PUSH */
            move::add_move(moves, move::encode_move(source_square, target_square, id, 0, 0, 0, 0, 0));
            if ((source_square >= a7 && source_square <= h7) && !generator::get_bit(generator::gamestate.occupancies[both], target_square + 8)
            ) {
              move::add_move(moves, move::encode_move(source_square, target_square + 8, id, 0, 0, 1, 0, 0));
            }
          }
        }

        attacks = piece.get_pawn_piece_state()[generator::gamestate.side][source_square] & generator::gamestate.occupancies[white];
        while (attacks) {
          target_square = generator::get_lsfb_index(attacks);
          if (source_square >= a2 && source_square <= h2) {
            /* PAWN: CAPTURE PROMOTION */
            if (promote != 0) {
              for (int i = 0; i < generator::black_promotions.size(); i++) {
                int promote_piece = generator::black_promotions[i];
                move::add_move(moves, move::encode_move(source_square, target_square, id, promote_piece, 1, 0, 0, 0));
              }
            }
          } else {
            /* PAWN: REGULAR CAPTURE */
            move::add_move(moves, move::encode_move(source_square, target_square, id, 0, 1, 0, 0, 0));
          }
          generator::pop_bit(attacks, target_square);
        }

        if (generator::gamestate.enpassant != no_sq) {
          uint64_t enpassant_attacks = piece.get_pawn_piece_state()[generator::gamestate.side][source_square] & (1 << generator::gamestate.enpassant);
          if (enpassant_attacks) {
            int target_enpassant = generator::get_lsfb_index(enpassant_attacks);
            move::add_move(moves, move::encode_move(source_square, target_enpassant, id, 0, 1, 0, 1, 0));
          }
        }

        generator::pop_bit(bitboard, source_square);
      }
    }

    if (color == black && king != 0) {
      /* BLACK KING SIDE CASTLE */
      if (generator::gamestate.castle & bk) {
        if (!generator::get_bit(generator::gamestate.occupancies[both], f8) && !generator::get_bit(
          generator::gamestate.occupancies[both], g8)
        ) {
          if (!square_attacked(e8, white, num_pieces) && !square_attacked(f8, white, num_pieces)) {
            move::add_move(moves, move::encode_move(e8, g8, id, 0, 0, 0, 0, 1));
          }
        }
      }
      
      /* BLACK QUEEN SIDE CASTLE */
      if (generator::gamestate.castle & bq) {
        if (!generator::get_bit(generator::gamestate.occupancies[both], d8) && !generator::get_bit(
          generator::gamestate.occupancies[both], c8) && !generator::get_bit(generator::gamestate.occupancies[both], b8)
        ) {
          if (!square_attacked(e1, white, num_pieces) && !square_attacked(d1, white, num_pieces)) {
            move::add_move(moves, move::encode_move(e8, c8, id, 0, 0, 0, 0, 1));
          }
        }
      }
    }

    int leaper = piece.get_leaper();
    int slider = piece.get_slider();

    if (leaper != 0 || slider != 0) {
      int check_move = 0;
      uint64_t attacks = 0ULL;

      while (bitboard)  {
        source_square = generator::get_lsfb_index(bitboard);
        check_move = move::get_check_move(piece, source_square);

        if (leaper != 0) {
          attacks |= piece.get_leaper_piece_state()[color][check_move][source_square] & ((color == white)
            ? ~generator::gamestate.occupancies[white] : ~generator::gamestate.occupancies[black]);
        }

        if (slider != 0) {
          attacks |= piece.get_sliding_piece_attacks(source_square, generator::gamestate.occupancies[both],
            piece.get_straight_constraints(), piece.get_diagonal_constraints()) & ((generator::gamestate.side == white)
            ? ~generator::gamestate.occupancies[white] : ~generator::gamestate.occupancies[black]);
        }

        while (attacks) {
          target_square = generator::get_lsfb_index(attacks);
          /* QUIET MOVE */
          if (!generator::get_bit(((generator::gamestate.side == white) ? generator::gamestate.occupancies[black]
            : generator::gamestate.occupancies[black]), target_square)) {
            move::add_move(moves, move::encode_move(source_square, target_square, id, 0, 0, 0, 0, 0));
          } else {
            /* CAPTURE MOVE */
            move::add_move(moves, move::encode_move(source_square, target_square, id, 0, 1, 0, 0, 0));
          }
          generator::pop_bit(attacks, target_square);
        }
        generator::pop_bit(attacks, source_square);
      }
    }
  }

  void generate_moves(MoveList moves, piece::Piece * pieces, int num_pieces) {
    for (int i = 0; i < num_pieces; i++) {
      piece::Piece piece = pieces[i];
      if (piece.get_color() != generator::gamestate.side) continue;
      generate_move(moves, piece, num_pieces);
    }
  }
}