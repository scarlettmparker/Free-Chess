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
    void init_sliding_pieces();
    uint64_t mask_straight_attacks(int pos);
    uint64_t mask_straight_attacks_otf(int pos, uint64_t block);
    uint64_t mask_diagonal_attacks(int pos);
    uint64_t mask_diagonal_attacks_otf(int pos, uint64_t block);
    inline int get_lsfb_index(uint64_t bitboard);
    uint64_t set_occupancy_bits(int idx, int bits_in_mask, uint64_t mask);
    inline int count_bits(uint64_t bitboard);
}
#endif