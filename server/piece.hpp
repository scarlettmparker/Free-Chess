#ifndef INCLUDED_PIECE
#define INCLUDED_PIECE

namespace piece {
  constexpr int LEAPER_PIECE_SIZE = 2;
  constexpr int LEAPER_PIECE_STATE_INNER_SIZE = 64;
  constexpr int PAWN_PIECE_STATE_SIZE = 64;
  
  class Piece {
    private:
      int id;
      int color;
      int move;
      int first_move;

      int king;
      int pawn;
      int enpassant;
      int promote;

      int slider;
      int leaper;
      int straight, diagonal;
      int rotational_move_type;

      int *** leaper_offsets;
      int * straight_constraints;
      int * diagonal_constraints;

      uint64_t * piece_mask;
      uint64_t * straight_piece_mask;
      uint64_t * diagonal_piece_mask;

      uint64_t ** sliding_diagonal_piece_state;
      uint64_t ** sliding_straight_piece_state;
      uint64_t ** leaper_piece_state;
      uint64_t ** pawn_piece_state;

    public:
      Piece(int id, int color);
      
      int get_pawn();
      int get_color();
      int get_straight();
      int get_diagonal();

      int *** get_leaper_offsets();
      uint64_t * get_diagonal_piece_mask();
      uint64_t * get_straight_piece_mask();
      uint64_t ** get_sliding_diagonal_piece_state();
      uint64_t ** get_sliding_straight_piece_state();
      uint64_t ** get_pawn_piece_state();

      uint64_t init_sliding_piece_attacks(int pos, uint64_t occupancy, 
        int * straight_constraints, int * diagonal_constraints);
      uint64_t mask_leaper_attacks(int pos, int ** offsets, int color);
      uint64_t mask_pawn_attacks(int color, int pos);
      uint64_t *** init_leaper_attacks();
      uint64_t ** init_pawn_attacks();
  };
}

#endif