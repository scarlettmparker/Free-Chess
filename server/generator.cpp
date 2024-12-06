#include <stdint.h>
#include <math.h>
#include "generator.hpp"

namespace mask_state {
  uint64_t * straight_piece_mask = nullptr;
  uint64_t * diagonal_piece_mask = nullptr;
  uint64_t ** straight_piece_state = nullptr;
  uint64_t ** diagonal_piece_state = nullptr;

  uint64_t * straight_magic_numbers = nullptr;
  uint64_t * diagonal_magic_numbers = nullptr;
  int * straight_relevant_bits = nullptr;
  int * diagonal_relevant_bits = nullptr;

  int * bit_count_lookup = nullptr;

  /**
   * Initializes the memory for piece masks and states.
   *
   * This ensures that the necessary memory for both straight and
   * diagonal piece masks and states is allocated. If memory has already
   * been allocated, no action is taken.
   */
  void init_mask_state() {
    if (!straight_piece_mask) {
      straight_piece_mask = new uint64_t[STRAIGHT_PIECE_MASK_SIZE];
    }
    if (!diagonal_piece_mask) {
      diagonal_piece_mask = new uint64_t[DIAGONAL_PIECE_MASK_SIZE];
    }
    if (!straight_piece_state) {
      straight_piece_state = new uint64_t*[STRAIGHT_PIECE_STATE_SIZE];
      for (int i = 0; i < STRAIGHT_PIECE_STATE_SIZE; ++i) {
        straight_piece_state[i] = new uint64_t[STRAIGHT_PIECE_STATE_INNER_SIZE];
      }
    }
    if (!diagonal_piece_state) {
      diagonal_piece_state = new uint64_t*[DIAGONAL_PIECE_STATE_SIZE];
      for (int i = 0; i < DIAGONAL_PIECE_STATE_SIZE; ++i) {
        diagonal_piece_state[i] = new uint64_t[DIAGONAL_PIECE_STATE_INNER_SIZE];
      }
    }
    if (!straight_magic_numbers) {
      straight_magic_numbers = new uint64_t[MAGIC_NUMBER_SIZE] {
        0x8a80104000800020ULL, 0x140002000100040ULL, 0x2801880a0017001ULL,
        0x100081001000420ULL, 0x200020010080420ULL, 0x3001c0002010008ULL,
        0x8480008002000100ULL, 0x2080088004402900ULL, 0x800098204000ULL,
        0x2024401000200040ULL, 0x100802000801000ULL, 0x120800800801000ULL,
        0x208808088000400ULL, 0x2802200800400ULL, 0x2200800100020080ULL,
        0x801000060821100ULL, 0x80044006422000ULL, 0x100808020004000ULL,
        0x12108a0010204200ULL, 0x140848010000802ULL, 0x481828014002800ULL,
        0x8094004002004100ULL, 0x4010040010010802ULL, 0x20008806104ULL,
        0x100400080208000ULL, 0x2040002120081000ULL, 0x21200680100081ULL,
        0x20100080080080ULL, 0x2000a00200410ULL, 0x20080800400ULL,
        0x80088400100102ULL, 0x80004600042881ULL, 0x4040008040800020ULL,
        0x440003000200801ULL, 0x4200011004500ULL, 0x188020010100100ULL,
        0x14800401802800ULL, 0x2080040080800200ULL, 0x124080204001001ULL,
        0x200046502000484ULL, 0x480400080088020ULL, 0x1000422010034000ULL,
        0x30200100110040ULL, 0x100021010009ULL, 0x2002080100110004ULL,
        0x202008004008002ULL, 0x20020004010100ULL, 0x2048440040820001ULL,
        0x101002200408200ULL, 0x40802000401080ULL, 0x4008142004410100ULL,
        0x2060820c0120200ULL, 0x1001004080100ULL, 0x20c020080040080ULL,
        0x2935610830022400ULL, 0x44440041009200ULL, 0x280001040802101ULL,
        0x2100190040002085ULL, 0x80c0084100102001ULL, 0x4024081001000421ULL,
        0x20030a0244872ULL, 0x12001008414402ULL, 0x2006104900a0804ULL,
        0x1004081002402ULL
      };
    }
    if (!diagonal_magic_numbers) {
      diagonal_magic_numbers = new uint64_t[MAGIC_NUMBER_SIZE] {
        0x40040844404084ULL, 0x2004208a004208ULL, 0x10190041080202ULL,
        0x108060845042010ULL, 0x581104180800210ULL, 0x2112080446200010ULL,
        0x1080820820060210ULL, 0x3c0808410220200ULL, 0x4050404440404ULL,
        0x21001420088ULL, 0x24d0080801082102ULL, 0x1020a0a020400ULL,
        0x40308200402ULL, 0x4011002100800ULL, 0x401484104104005ULL,
        0x801010402020200ULL, 0x400210c3880100ULL, 0x404022024108200ULL,
        0x810018200204102ULL, 0x4002801a02003ULL, 0x85040820080400ULL,
        0x810102c808880400ULL, 0xe900410884800ULL, 0x8002020480840102ULL,
        0x220200865090201ULL, 0x2010100a02021202ULL, 0x152048408022401ULL,
        0x20080002081110ULL, 0x4001001021004000ULL, 0x800040400a011002ULL,
        0xe4004081011002ULL, 0x1c004001012080ULL, 0x8004200962a00220ULL,
        0x8422100208500202ULL, 0x2000402200300c08ULL, 0x8646020080080080ULL,
        0x80020a0200100808ULL, 0x2010004880111000ULL, 0x623000a080011400ULL,
        0x42008c0340209202ULL, 0x209188240001000ULL, 0x400408a884001800ULL,
        0x110400a6080400ULL, 0x1840060a44020800ULL, 0x90080104000041ULL,
        0x201011000808101ULL, 0x1a2208080504f080ULL, 0x8012020600211212ULL,
        0x500861011240000ULL, 0x180806108200800ULL, 0x4000020e01040044ULL,
        0x300000261044000aULL, 0x802241102020002ULL, 0x20906061210001ULL,
        0x5a84841004010310ULL, 0x4010801011c04ULL, 0xa010109502200ULL,
        0x4a02012000ULL, 0x500201010098b028ULL, 0x8040002811040900ULL,
        0x28000010020204ULL, 0x6000020202d0240ULL, 0x8918844842082200ULL,
        0x4010011029020020ULL
      };
    }
    if (!straight_relevant_bits) {
      straight_relevant_bits = new int[RELEVANT_BIT_SIZE] {
        12, 11, 11, 11, 11, 11, 11, 12, 
        11, 10, 10, 10, 10, 10, 10, 11, 
        11, 10, 10, 10, 10, 10, 10, 11, 
        11, 10, 10, 10, 10, 10, 10, 11, 
        11, 10, 10, 10, 10, 10, 10, 11, 
        11, 10, 10, 10, 10, 10, 10, 11, 
        11, 10, 10, 10, 10, 10, 10, 11, 
        12, 11, 11, 11, 11, 11, 11, 12
      };
    }
    if (!diagonal_relevant_bits) {
      diagonal_relevant_bits = new int[RELEVANT_BIT_SIZE] {
        6, 5, 5, 5, 5, 5, 5, 6, 
        5, 5, 5, 5, 5, 5, 5, 5, 
        5, 5, 7, 7, 7, 7, 5, 5, 
        5, 5, 7, 9, 9, 7, 5, 5, 
        5, 5, 7, 9, 9, 7, 5, 5, 
        5, 5, 7, 7, 7, 7, 5, 5, 
        5, 5, 5, 5, 5, 5, 5, 5, 
        6, 5, 5, 5, 5, 5, 5, 6
      };
    }
    if (!bit_count_lookup) {
      bit_count_lookup = new int[256]();
      for (int i = 0; i < 256; ++i) {
        int count = 0;
        int num = i;
        while (num) {
          num &= num - 1;
          count++;
        }
        bit_count_lookup[i] = count;
      }
    }
  }

  /**
   * Cleans up the dynamically allocated memory for piece masks and states.
   *
   * This frees the memory previously allocated by `init_mask_state()`,
   * preventing memory leaks. It sets all relevant pointers to `nullptr`.
   */
  void cleanup_mask_state() {
    if (straight_piece_mask) {
      delete[] straight_piece_mask;
      straight_piece_mask = nullptr;
    }
    if (diagonal_piece_mask) {
      delete[] diagonal_piece_mask;
      diagonal_piece_mask = nullptr;
    }
    if (straight_piece_state) {
      for (int i = 0; i < STRAIGHT_PIECE_STATE_SIZE; ++i) {
        delete[] straight_piece_state[i];
      }
      delete[] straight_piece_state;
      straight_piece_state = nullptr;
    }
    if (diagonal_piece_state) {
      for (int i = 0; i < DIAGONAL_PIECE_STATE_SIZE; ++i) {
        delete[] diagonal_piece_state[i];
      }
      delete[] diagonal_piece_state;
      diagonal_piece_state = nullptr;
    }
    if (straight_magic_numbers) {
      delete[] straight_magic_numbers;
      straight_magic_numbers = nullptr;
    }
    if (diagonal_magic_numbers) {
      delete[] diagonal_magic_numbers;
      diagonal_magic_numbers = nullptr;
    }
    if (straight_relevant_bits) {
      delete[] straight_relevant_bits;
      straight_relevant_bits = nullptr;
    }
    if (diagonal_relevant_bits) {
      delete[] diagonal_relevant_bits;
      diagonal_relevant_bits = nullptr;
    }
    if (bit_count_lookup) {
      delete[] bit_count_lookup;
      bit_count_lookup = nullptr;
    }
  }
}

namespace generator {
  uint64_t set_bit(uint64_t bitboard, int square) { return bitboard | (1ULL << square); }
  uint64_t get_bit(uint64_t bitboard, int square) { return bitboard & (1ULL << square); }
  uint64_t pop_bit(uint64_t bitboard, int square) { return bitboard & ~(1ULL << square); }

  /**
   * Function to mask sliding straight attacks.
   *
   * This is used to later generate the look up tables for all
   * board occupancies using magic bitboards.
   *
   * @param pos Position on the bitboard to mask moves for.
   * @returns Sliding straight attacks for a given position.
   */
  uint64_t mask_straight_attacks(int pos) {
    uint64_t current_attacks = 0ULL;
    int target_rank = pos / 8;
    int target_file = pos % 8;

    // upward
    for (int rank = target_rank + 1; rank <= 6; rank++) {
      current_attacks |= (1ULL << (rank * 8 + target_file));
    }

    // downward
    for (int rank = target_rank - 1; rank >= 1; rank--) {
      current_attacks |= (1ULL << (rank * 8 + target_file));
    }

    // leftward
    for (int file = target_file - 1; file >= 1; file--) {
      current_attacks |= (1ULL << (target_rank * 8 + file));
    }

    // rightward
    for (int file = target_file + 1; file <= 6; file++) {
      current_attacks |= (1ULL << (target_rank * 8 + file));
    }
    return current_attacks;
  }

  /**
   * Function to mask sliding straight attacks given a blocking mask.
   *
   * This is used to generate all straight attacks for our look-up table
   * later on, and considers which pieces are blocking the sliding movement.
   *
   * @param pos Position on the bitboard to mask moves for.
   * @param block Bitboard representing currently blocked squares.
   */
  uint64_t mask_straight_attacks_otf(int pos, uint64_t block) {
    uint64_t current_attacks = 0ULL;
    int target_rank = pos / 8;
    int target_file = pos % 8;

    // upward
    for (int rank = target_rank + 1; rank <= 7; rank++) {
      uint64_t square = 1ULL << (rank * 8 + target_file);
      current_attacks |= square;
      if (square & block) break;
    }

    // downward
    for (int rank = target_rank - 1; rank >= 0; rank--) {
      uint64_t square = 1ULL << (rank * 8 + target_file);
      current_attacks |= square;
      if (square & block) break;
    }

    // leftward
    for (int file = target_file - 1; file >= 0; file--) {
      uint64_t square = 1ULL << (target_rank * 8 + file);
      current_attacks |= square;
      if (square & block) break;
    }

    // rightward
    for (int file = target_file + 1; file <= 7; file++) {
      uint64_t square = 1ULL << (target_rank * 8 + file);
      current_attacks |= square;
      if (square & block) break;
    }
    return current_attacks;
  }

  uint64_t mask_diagonal_attacks(int pos) {
    uint64_t current_attacks = 0ULL;
    int target_rank = pos / 8;
    int target_file = pos % 8;

    // down right
    for (int rank = target_rank + 1, file = target_file + 1;
    rank <= 6 && file <= 6; rank++, file++) {
      current_attacks |= (1ULL << (rank * 8 + file));
    }

    // up right
    for (int rank = target_rank - 1, file = target_file + 1;
    rank >= 1 && file <= 6; rank--, file++) {
      current_attacks |= (1ULL << (rank * 8 + file));
    }

    // down left
    for (int rank = target_rank + 1, file = target_file - 1;
    rank <= 6 && file >= 1; rank++, file--) {
      current_attacks |= (1ULL << (rank * 8 + file));
    }

    // up left
    for (int rank = target_rank - 1, file = target_file - 1;
    rank >= 1 && file >= 1; rank--, file--) {
      current_attacks |= (1ULL << (rank * 8 + file));
    }

    return current_attacks;
  }

  uint64_t mask_diagonal_attacks_otf(int pos, uint64_t block) {
    uint64_t current_attacks = 0ULL;
    int target_rank = pos / 8;
    int target_file = pos % 8;

    // down right
    for (int rank = target_rank + 1, file = target_file + 1;
    rank <= 7 && file <= 7; rank++, file++) {
      uint64_t square = 1ULL << (rank * 8 + file);
      current_attacks |= square;
      if (square & block) break;
    }

    // up right
    for (int rank = target_rank - 1, file = target_file + 1;
    rank >= 0 && file <= 7; rank--, file++) {
      uint64_t square = 1ULL << (rank * 8 + file);
      current_attacks |= square;
      if (square & block) break;
    }

    // down left
    for (int rank = target_rank + 1, file = target_file - 1;
    rank <= 7 && file >= 0; rank++, file--) {
      uint64_t square = 1ULL << (rank * 8 + file);
      current_attacks |= square;
      if (square & block) break;
    }

    // up left
    for (int rank = target_rank - 1, file = target_file - 1;
    rank >= 0 && file >= 0; rank--, file--) {
      uint64_t square = 1ULL << (rank * 8 + file);
      current_attacks |= square;
      if (square & block) break;
    }

    return current_attacks;
  }

  int get_direction_offset(int dir, int straight) {
    int straight_offsets[4] = {-8, 8, -1, 1};
    int diagonal_offsets[4] = {9, -7, 7, -9};
    return straight ? straight_offsets[dir] : diagonal_offsets[dir];
  }

  uint64_t limit_moves(uint64_t moves, int max_steps, int pos, int dir, int straight) {
    uint64_t limited_moves = 0ULL;
    int direction_offset = get_direction_offset(dir, straight);

    for (int step = 1; step < max_steps; step++) {
      int target_pos = pos + step * direction_offset;

      if (target_pos >= 0 && target_pos < 64) {
        uint64_t bit = 1 << target_pos;
        if (moves & bit) limited_moves |= bit;
        else break;
      }
    }

    return limited_moves;
  }

  uint64_t apply_constraints(uint64_t moves, int * constraints, int pos, int straight) {
    uint64_t constrained_moves = 0ULL;
    if (!constraints) return constrained_moves;

    for (int dir = 0; dir < 4; dir++) {
      constrained_moves |= limit_moves(moves, constraints[dir], pos, dir, straight);
    }

    return constrained_moves;
  }

  /**
   * Retrieves the index of the least significant 1 bit in a bitboard.
   *
   * This isolates the least significant 1 bit and computes its binary
   * logarithm to determine its index, and returns that index.
   *
   * @param bitboard 64-bit integer to find least significant 1 bit.
   */
  inline int get_lsfb_index(uint64_t bitboard) {
    if (bitboard) {
      return count_bits((bitboard & -bitboard) - 1);
    } else {
      return -1;
    }
  }

  /**
   * Generates an occupancy bitboard based on a given mask and index.
   *
   * This iterates through all bits in the mask, extracts the position of
   * each set bit using `get_lsfb_index()`, and sets the corresponding
   * bit in the occupancy bitboard based on the binary representation of `index`
   *
   * @param idx Index to determine which bits are set in the bitboard.
   * @param bits_in_mask Number of bits set in the mask.
   * @param mask 64-bit unsigned int representing the positions available
   * for occupancy.
   *
   * @return 64-bit unsigned integer representing the occupancy bitboard.
   */
  uint64_t set_occupancy_bits(int idx, int bits_in_mask, uint64_t mask) {
    uint64_t occupancy = 0ULL;
    for (int count = 0; count < bits_in_mask; count++) {
      int square = get_lsfb_index(mask);
      pop_bit(mask, square);

      if (idx & (1 << count))
        occupancy |= (1ULL << square);
    }
    return occupancy;
  }

  /**
   * Counts the number of bits set to 1 in a 64-bit integer (bitboard).
   *
   * This iterates through the 64-bit bitboard in chunks of 8 bits at once,
   * using a lookup table (`bit_count_lookup`) for efficiency in lookup.
   *
   * @param bitboard 64-bit integer for counting the bits.
   * @return Number of bits set to 1 in a given bitboard.
   */
  inline int count_bits(uint64_t bitboard) {
    int count = 0;
    while (bitboard) {
      int chunk = bitboard & 0xFF;
      count += mask_state::bit_count_lookup[chunk];
      bitboard >>= 8;
    }
    return count;
  }

  uint64_t get_file_constraint(int file_offset) {
    switch(file_offset) {
      case -2:
        return 4557430888798830399ULL; // not hg file
      case -1:
        return 9187201950435737471ULL; // not h file
      case 1:
        return 18374403900871474942ULL; // not a file
      case 2:
        return 18229723555195321596ULL; // not ab file
      default:
        return 0;
    }
  }

  /**
   * Function that initializes piece attacks for sliding pieces.
   *
   * This precomputes attack states for each square on the board, using magic
   * numbers for quick lookup. This works by considering all possible attack
   * states based on given board occupancies and positions of pieces.  
   */
  void init_sliding_pieces() {
    for (int square = 0; square < 64; square++) {
      mask_state::straight_piece_mask[square] = mask_straight_attacks(square);
      int relevant_bits_count = count_bits(mask_state::straight_piece_mask[square]);
      int occupancy_indicies = (1 << relevant_bits_count);

      // straight moving pieces
      for (int idx = 0; idx < occupancy_indicies; idx++) {
        uint64_t occupancy = set_occupancy_bits(idx,
          relevant_bits_count,
          mask_state::straight_piece_mask[square]);
        int magic_idx = (occupancy * mask_state::straight_magic_numbers[square])
          >> (64 - mask_state::straight_relevant_bits[square]);
        mask_state::straight_piece_state[square][magic_idx]
          = mask_straight_attacks_otf(square, occupancy);
      }

      mask_state::diagonal_piece_mask[square] = mask_diagonal_attacks(square);
      relevant_bits_count = count_bits(mask_state::diagonal_piece_mask[square]);
      occupancy_indicies = (1 << relevant_bits_count);

      // diagonal moving pieces
      for (int idx = 0; idx < occupancy_indicies; idx++) {
        uint64_t occupancy = set_occupancy_bits(idx,
          relevant_bits_count,
          mask_state::diagonal_piece_mask[square]);
        int magic_idx = (occupancy * mask_state::diagonal_magic_numbers[square])
          >> (64 - mask_state::diagonal_relevant_bits[square]);
        mask_state::diagonal_piece_state[square][magic_idx]
          = mask_diagonal_attacks_otf(square, occupancy);
      }
    }
  }
}