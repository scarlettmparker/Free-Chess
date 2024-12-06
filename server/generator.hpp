#ifndef INCLUDED_GENERATOR
#define INCLUDED_GENERATOR

namespace mask_state {
  constexpr int STRAIGHT_PIECE_MASK_SIZE = 64;
  constexpr int DIAGONAL_PIECE_MASK_SIZE = 64;
  constexpr int STRAIGHT_PIECE_STATE_SIZE = 64;
  constexpr int DIAGONAL_PIECE_STATE_SIZE = 64;
  constexpr int STRAIGHT_PIECE_STATE_INNER_SIZE = 4096;
  constexpr int DIAGONAL_PIECE_STATE_INNER_SIZE = 512;
  constexpr int MAGIC_NUMBER_SIZE = 64;
  constexpr int RELEVANT_BIT_SIZE = 64;

  extern uint64_t * straight_piece_mask;
  extern uint64_t * diagonal_piece_mask;
  extern uint64_t ** straight_piece_state;
  extern uint64_t ** diagonal_piece_state;

  extern uint64_t * straight_magic_numbers;
  extern uint64_t * diagonal_magic_numbers;
  extern int * straight_relevant_bits;
  extern int * diagonal_relevant_bits;
  extern int * bit_count_lookup;

  void init_mask_state();
  void cleanup_mask_state();
}

namespace generator {
  uint64_t set_bit(uint64_t bitboard, int square);
  uint64_t get_bit(uint64_t bitboard, int square);
  uint64_t pop_bit(uint64_t bitboard, int square);
  uint64_t mask_straight_attacks(int pos);
  uint64_t mask_straight_attacks_otf(int pos, uint64_t block);
  uint64_t mask_diagonal_attacks(int pos);
  uint64_t mask_diagonal_attacks_otf(int pos, uint64_t block);
  int get_direction_offset(int dir, int straight);
  uint64_t limit_moves(uint64_t moves, int max_steps, int pos, int dir, int straight);
  uint64_t apply_constraints(uint64_t moves, int * constraints, int pos, int straight);
  inline int get_lsfb_index(uint64_t bitboard);
  uint64_t set_occupancy_bits(int idx, int bits_in_mask, uint64_t mask);
  uint64_t get_file_constraint(int file_offset);
  inline int count_bits(uint64_t bitboard);
  void init_sliding_pieces();
}

#endif