from flask import Flask, request, jsonify
from stockfish import Stockfish
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
stockfish = Stockfish(path="C:/users/hanne/stockfish-exe/stockfish/stockfish-windows-x86-64-avx2.exe")

@app.route('/')
def home():
    return "Chess backend is running!"

@app.route('/best_move', methods=['POST'])
def get_best_move():
    fen = request.json['fen']
    stockfish.set_fen_position(fen)
    best_move = stockfish.get_best_move()
    return jsonify({'best_move': best_move})

@app.route('/analyze', methods=['POST'])
def analyze_position():
    fen = request.json['fen']
    stockfish.set_fen_position(fen)
    
    best_move = stockfish.get_best_move()
    evaluation = stockfish.get_evaluation()
    
    # Convert evaluation to a simple number
    if evaluation['type'] == 'cp':
        score = evaluation['value'] / 100  # Convert centipawns to pawns
    elif evaluation['type'] == 'mate':
        score = 'M' + str(evaluation['value'])  # Mate in x moves
    else:
        score = 0
    
    return jsonify({
        'best_move': best_move,
        'evaluation': score,
        'fen': fen
    })

if __name__ == '__main__':
    app.run(debug=True)