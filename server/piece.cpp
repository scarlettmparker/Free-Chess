#include <stdint.h>
#include <cstddef>

#include "generator.hpp"
#include "piece.hpp"

#define NOT_A_FILE 18374403900871474942ULL
#define NOT_AB_FILE 18229723555195321596ULL
#define NOT_H_FILE 9187201950435737471ULL
#define NOT_HG_FILE 4557430888798830399ULL

namespace piece {
  Piece::Piece(int id, int color) {
    this->id = id;
    this->color = color;

    this->move = 0, this->king = 0, this->pawn = 0,
    this->enpassant = 0, this->promote = 0;

    this->slider = 0, this->leaper = 0;        
    this->straight = 0, this->diagonal = 0;

    this->rotational_move_type = 0;
    this->leaper_offsets = LeaperOffsets();
    this->straight_constraints = nullptr;
    this->diagonal_constraints = nullptr;

    this->piece_mask = nullptr;
    this->straight_piece_mask = nullptr;
    this->diagonal_piece_mask = nullptr;

    this->sliding_diagonal_piece_state = nullptr;
    this->sliding_straight_piece_state = nullptr;
    this->leaper_piece_state = nullptr;
    this->pawn_piece_state = nullptr;
  }

  Piece::~Piece() {
    delete[] this->straight_constraints;
    delete[] this->diagonal_constraints;
    delete[] this->piece_mask;
    delete[] this->straight_piece_mask;
    delete[] this->diagonal_piece_mask;
    delete[] this->sliding_diagonal_piece_state;
    delete[] this->sliding_straight_piece_state;
    delete[] this->leaper_piece_state;
    delete[] this->pawn_piece_state;
  }

  Pawn::Pawn(int id, int color) : Piece(id, color) {
    this->pawn = 1;
    this->enpassant = 1;
    this->promote = 1;
  }

  Knight::Knight(int id, int color) : Piece(id, color) {
    this->leaper = 1;
    this->leaper_offsets.offsets = new int**[1];

    this->leaper_offsets.offsets[0] = new int*[8];
    for (int i = 0; i < 8; ++i) {
      this->leaper_offsets.offsets[0][i] = new int[2];
    }

    /* KNIGHT MOVES */
    this->leaper_offsets.offsets[0][0][0] = -2; this->leaper_offsets.offsets[0][0][1] = 1;
    this->leaper_offsets.offsets[0][1][0] = -1; this->leaper_offsets.offsets[0][1][1] = 2;
    this->leaper_offsets.offsets[0][2][0] = 1; this->leaper_offsets.offsets[0][2][1] = 2;
    this->leaper_offsets.offsets[0][3][0] = 2; this->leaper_offsets.offsets[0][3][1] = 1;
    this->leaper_offsets.offsets[0][4][0] = -2; this->leaper_offsets.offsets[0][4][1] = -1;
    this->leaper_offsets.offsets[0][5][0] = -1; this->leaper_offsets.offsets[0][5][1] = -2;
    this->leaper_offsets.offsets[0][6][0] = 1; this->leaper_offsets.offsets[0][6][1] = -2;
    this->leaper_offsets.offsets[0][7][0] = 2; this->leaper_offsets.offsets[0][7][1] = -1;

    this->leaper_offsets.size = 1;
  }

  Knight::~Knight() {
    for (int i = 0; i < 8; ++i) {
      delete[] this->leaper_offsets.offsets[0][i];
    }
    delete[] this->leaper_offsets.offsets[0];
  }

  Bishop::Bishop(int id, int color) : Piece(id, color) {
    this->slider = 1;
    this->diagonal = 1;
    this->diagonal_constraints = new int[4]{8, 8, 8, 8};
  }

  Bishop::~Bishop() {
    delete[] this->diagonal_constraints;
  }

  Rook::Rook(int id, int color) : Piece(id, color) {
    this->slider = 1;
    this->straight = 1;
    this->straight_constraints = new int[4]{8, 8, 8, 8};
  }

  Rook::~Rook() {
    delete[] this->straight_constraints;
  }

  Queen::Queen(int id, int color) : Piece(id, color) {
    this->slider = 1;
    this->straight = 1;
    this->diagonal = 1;

    this->straight_constraints = new int[4]{8, 8, 8, 8};
    this->diagonal_constraints = new int[4]{8, 8, 8, 8};
  }

  Queen::~Queen() {
    delete[] this->straight_constraints;
    delete[] this->diagonal_constraints;
  }

  King::King(int id, int color) : Piece(id, color) {
    this->leaper = 1;
    this->leaper_offsets.offsets = new int**[1];

    this->leaper_offsets.offsets[0] = new int*[8];
    for (int i = 0; i < 8; ++i) {
      this->leaper_offsets.offsets[0][i] = new int[2];
    }

    /* KING MOVES */
    this->leaper_offsets.offsets[0][0][0] = -1; this->leaper_offsets.offsets[0][0][1] = 1;
    this->leaper_offsets.offsets[0][1][0] = 0; this->leaper_offsets.offsets[0][1][1] = 1;
    this->leaper_offsets.offsets[0][2][0] = 1; this->leaper_offsets.offsets[0][2][1] = 1;
    this->leaper_offsets.offsets[0][3][0] = -1; this->leaper_offsets.offsets[0][3][1] = 0;
    this->leaper_offsets.offsets[0][4][0] = 1; this->leaper_offsets.offsets[0][4][1] = 0;
    this->leaper_offsets.offsets[0][5][0] = -1; this->leaper_offsets.offsets[0][5][1] = -1;
    this->leaper_offsets.offsets[0][6][0] = 0; this->leaper_offsets.offsets[0][6][1] = -1;
    this->leaper_offsets.offsets[0][7][0] = 1; this->leaper_offsets.offsets[0][7][1] = -1;

    this->leaper_offsets.size = 1;
  }

  King::~King() {
    for (int i = 0; i < 8; ++i) {
      delete[] this->leaper_offsets.offsets[0][i];
    }
    delete[] this->leaper_offsets.offsets[0];
    delete[] this->leaper_offsets.offsets;
  }

  PogoPiece::PogoPiece(int id, int color) : Piece(id, color) {
    // reverse is map<number, number>
    this->leaper = 1;
    this->rotational_move_type = 2; // REVERSE ROTATE

    this->leaper_offsets.offsets = new int**[4];
    for (int i = 0; i < 4; ++i) {
      this->leaper_offsets.offsets[i] = new int*[2];
    }

    /* POGO PIECE MOVES */
    this->leaper_offsets.offsets[0][0][0] = 0;
    this->leaper_offsets.offsets[0][0][1] = 2;

    this->leaper_offsets.offsets[1][0][0] = 0;
    this->leaper_offsets.offsets[1][0][1] = -1;

    this->leaper_offsets.offsets[2][0][0] = 0;
    this->leaper_offsets.offsets[2][0][1] = -2;

    this->leaper_offsets.offsets[3][0][0] = 0;
    this->leaper_offsets.offsets[3][0][1] = 1;
    
    this->leaper_offsets.size = 4;
  }

  PogoPiece::~PogoPiece() {
    for (int i = 0; i < 4; ++i) {
      delete[] this->leaper_offsets.offsets[i];
    }
    delete[] this->leaper_offsets.offsets;
  }

  int Piece::get_id() {
    return this->id;
  }

  int Piece::get_king() {
    return this->king;
  }
  
  int Piece::get_pawn() {
    return this->pawn;
  }

  int Piece::get_enpassant() {
    return this->enpassant;
  }

  int Piece::get_promote() {
    return this->promote;
  }

  int Piece::get_color() {
    return this->color;
  }

  int Piece::get_leaper() {
    return this->leaper;
  }

  int Piece::get_slider() {
    return this->slider;
  }

  int Piece::get_straight() {
    return this->straight;
  }

  int Piece::get_diagonal() {
    return this->diagonal;
  }

  int Piece::get_rotational_move_type() {
    return this->rotational_move_type;
  }

  LeaperOffsets Piece::get_leaper_offsets() {
    return this->leaper_offsets;
  }

  int * Piece::get_straight_constraints() {
    return this->straight_constraints;
  }

  int * Piece::get_diagonal_constraints() {
    return this->diagonal_constraints;
  }

  uint64_t * Piece::get_diagonal_piece_mask() {
    return this->diagonal_piece_mask;
  }

  uint64_t * Piece::get_straight_piece_mask() {
    return this->straight_piece_mask;
  }

  uint64_t *** Piece::get_leaper_piece_state() {
    return this->leaper_piece_state;
  }

  uint64_t ** Piece::get_sliding_diagonal_piece_state() {
    return this->sliding_diagonal_piece_state;
  }

  uint64_t ** Piece::get_sliding_straight_piece_state() {
    return this->sliding_straight_piece_state;
  }

  uint64_t ** Piece::get_pawn_piece_state() {
    return this->pawn_piece_state;
  }

  uint64_t Piece::get_sliding_piece_attacks(int pos, uint64_t occupancy,
    int * straight_constraints, int * diagonal_constraints) {
    uint64_t piece_state = 0ULL;

    if (get_straight()) {
      uint64_t straight_occupancy = occupancy & get_straight_piece_mask()[pos];
      straight_occupancy *= mask_state::straight_magic_numbers[pos]
        >> (64 - mask_state::straight_relevant_bits[pos]);

      uint64_t raw_straight_moves = get_sliding_straight_piece_state()[pos][straight_occupancy];
      piece_state |= generator::apply_constraints(raw_straight_moves, straight_constraints, pos, 1);
    }

    if (get_diagonal()) {
      uint64_t diagonal_occupancy = occupancy & get_diagonal_piece_mask()[pos];
      diagonal_occupancy *= mask_state::diagonal_magic_numbers[pos]
        >> (64 - mask_state::diagonal_relevant_bits[pos]);
      
      uint64_t raw_diagonal_moves = get_sliding_diagonal_piece_state()[pos][diagonal_occupancy];
      piece_state |= generator::apply_constraints(raw_diagonal_moves, diagonal_constraints, pos, 0);
    }

    return piece_state;
  }

  uint64_t Piece::mask_leaper_attacks(int pos, int ** offsets, int color) {
    uint64_t current_attacks = 0ULL;
    uint64_t current_bitboard = 0ULL;

    current_bitboard = generator::set_bit(current_bitboard, pos);
    int is_black = color == 1;

    for (int i = 0; offsets[i] != nullptr; i++) {
      int file_offset = offsets[i][0];
      int rank_offset = offsets[i][1];

      if (is_black) {
        file_offset *= -1;
        rank_offset *= -1;
      }

      int64_t shift = static_cast<int64_t>(rank_offset) * 8 - file_offset;
      uint64_t file_constraint = generator::get_file_constraint(file_offset);

      if (shift > 0) {
        if (current_bitboard >> shift & file_constraint) {
          uint64_t shifted_bitboard = current_bitboard >> shift;
          current_attacks |= shifted_bitboard & file_constraint;
        }
      } else {
        if (current_bitboard << -shift & file_constraint) {
          uint64_t shifted_bitboard = current_bitboard << -shift;
          current_attacks |= shifted_bitboard & file_constraint;
        }
      }
    }
    
    return current_attacks;
  }

  uint64_t Piece::mask_pawn_attacks(int color, int pos) {
    uint64_t current_attacks = 0ULL;
    uint64_t current_bitboard = 0ULL;

    current_bitboard = generator::set_bit(current_bitboard, pos);
    int pawn = get_pawn();

    if (pawn != 0 && color == 0) {
      if (current_bitboard >> 7 & NOT_A_FILE)
        current_attacks |= current_bitboard >> 7;
      if (current_bitboard >> 9 & NOT_H_FILE)
        current_attacks |= current_bitboard >> 9;
    } else if (pawn != 0 && color == 1) {
      if (current_bitboard << 7 & NOT_H_FILE)
        current_attacks |= current_bitboard << 7;
      if (current_bitboard << 9 & NOT_A_FILE)
        current_attacks |= current_bitboard << 9;
    }

    return current_attacks;
  }

  uint64_t *** Piece::init_leaper_attacks() {
    LeaperOffsets leaper_offsets = get_leaper_offsets();
    size_t first_dim = leaper_offsets.size;
    uint64_t ***piece_state = new uint64_t**[first_dim];
    
    for (size_t i = 0; i < first_dim; i++) {
        piece_state[i] = new uint64_t*[LEAPER_PIECE_SIZE];
        for (size_t j = 0; j < LEAPER_PIECE_SIZE; j++) {
            piece_state[i][j] = new uint64_t[LEAPER_PIECE_STATE_INNER_SIZE]();
        }
    }

    for (size_t i = 0; i < first_dim; i++) {
        for (int square = 0; square < 64; square++) {
          piece_state[i][0][square] = mask_leaper_attacks(square, reinterpret_cast<int**>(leaper_offsets.offsets[i]), 0);
          piece_state[i][1][square] = mask_leaper_attacks(square, reinterpret_cast<int**>(leaper_offsets.offsets[i]), 1);
        }
    }

    return piece_state;
  }

  uint64_t ** Piece::init_pawn_attacks() {
    uint64_t ** piece_state = get_pawn_piece_state();

    for (int square = 0; square < 64; square++) {
      piece_state[0][square] = mask_pawn_attacks(0, square);
      piece_state[1][square] = mask_pawn_attacks(1, square);
    }

    return piece_state;
  }
}