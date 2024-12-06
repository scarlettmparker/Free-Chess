CXX = g++
CXXFLAGS = -O3 -march=native
SRCS = main.cpp generator.cpp piece.cpp

OUT = game.out
all: $(OUT)

$(OUT): $(SRCS)
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(OUT)

clean:
	rm -f $(OUT)