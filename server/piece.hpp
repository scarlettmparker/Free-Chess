#ifndef INCLUDED_PIECE
#define INCLUDED_PIECE

#include <stdint.h>

namespace piece {
  constexpr int LEAPER_PIECE_SIZE = 2;
  constexpr int LEAPER_PIECE_STATE_INNER_SIZE = 64;
  constexpr int PAWN_PIECE_STATE_SIZE = 64;

  struct LeaperOffsets {
    int ***offsets;
    int size;

    LeaperOffsets() : offsets(nullptr), size(0) {}
  };

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

      LeaperOffsets leaper_offsets;
      int * straight_constraints;
      int * diagonal_constraints;

      uint64_t * piece_mask;
      uint64_t * straight_piece_mask;
      uint64_t * diagonal_piece_mask;

      uint64_t ** sliding_diagonal_piece_state;
      uint64_t ** sliding_straight_piece_state;
      uint64_t *** leaper_piece_state;
      uint64_t ** pawn_piece_state;

    public:
      Piece(int id, int color);
      ~Piece();
      
      int get_id();
      int get_king();
      int get_pawn();
      int get_enpassant();
      int get_promote();
      int get_color();

      int get_leaper();
      int get_slider();
      int get_straight();
      int get_diagonal();
      int get_rotational_move_type();

      LeaperOffsets get_leaper_offsets();
      int * get_straight_constraints();
      int * get_diagonal_constraints();
      uint64_t * get_diagonal_piece_mask();
      uint64_t * get_straight_piece_mask();

      uint64_t *** get_leaper_piece_state();
      uint64_t ** get_sliding_diagonal_piece_state();
      uint64_t ** get_sliding_straight_piece_state();
      uint64_t ** get_pawn_piece_state();
      uint64_t get_sliding_piece_attacks(int pos, uint64_t occupancy, 
        int * straight_constraints, int * diagonal_constraints);

      uint64_t mask_leaper_attacks(int pos, int ** offsets, int color);
      uint64_t mask_pawn_attacks(int color, int pos);
      uint64_t *** init_leaper_attacks();
      uint64_t ** init_pawn_attacks();
  };

  
  class Pawn: public Piece {
    public:
      int pawn, enpassant, promote;
      Pawn(int id, int color);
  };

  class Knight: public Piece {
    public:
      int leaper;
      LeaperOffsets leaper_offsets;
      Knight(int id, int color);
      ~Knight();
  };
  
  class Bishop: public Piece {
    public:
      int slider, diagonal;
      int * diagonal_constraints;
      Bishop(int id, int color);
      ~Bishop();
  };

  class Rook: public Piece {
    public:
      int slider, straight;
      int * straight_constraints;
      Rook(int id, int color);
      ~Rook();
  };

  class Queen: public Piece {
    public:
      int slider, straight, diagonal;
      int * straight_constraints;
      int * diagonal_constraints;
      Queen(int id, int color);
      ~Queen();
  };

  class King: public Piece {
    public:
      int leaper;
      LeaperOffsets leaper_offsets;
      King(int id, int color);
      ~King();
  };

  class PogoPiece: public Piece {
    public:
      // reverse is map<number, number>
      int leaper, rotational_move_type;
      LeaperOffsets leaper_offsets;
      PogoPiece(int id, int color);
      ~PogoPiece();
  };
}

#endif