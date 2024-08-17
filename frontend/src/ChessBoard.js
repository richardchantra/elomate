import React, { useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const ChessBoardComponent = () => {
  const [game, setGame] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState(Math.random() < 0.5 ? 'w' : 'b');
  const [status, setStatus] = useState(playerColor === 'w' ? "Your move" : "Computer is thinking...");
  const [evaluation, setEvaluation] = useState(0);
  const [fen, setFen] = useState(game.fen());

  useEffect(() => {
    if (game.turn() !== playerColor) {
      analyzePosition(game.fen());
    } else {
      checkGameStatus();
    }
  }, [game, playerColor]);

  const customSquareStyles = useCallback(() => {
    const squareStyles = {};
    const lightSquareStyle = { backgroundColor: '#e7d8f7' };
    const darkSquareStyle = { backgroundColor: '#883bd5' };

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = String.fromCharCode(97 + col) + (8 - row);
        squareStyles[square] = (row + col) % 2 === 0 ? lightSquareStyle : darkSquareStyle;
      }
    }
    return squareStyles;
  }, []);

  function makeAMove(move) {
    const gameCopy = new Chess(game.fen());
    let result;
    try {
      result = gameCopy.move(move);
    } catch (e) {
      return null;  // Return null for illegal moves
    }
    setGame(gameCopy);
    setFen(gameCopy.fen());
    return result;
  }

  function checkGameStatus() {
    if (game.isCheckmate()) {
      setStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (game.isDraw()) {
      setStatus("Game Over. It's a draw!");
    } else if (game.isCheck()) {
      setStatus(`${game.turn() === 'w' ? 'White' : 'Black'} is in check!`);
    } else {
      setStatus(game.turn() === playerColor ? "Your move" : "Computer is thinking...");
    }
  }

  function onDrop(sourceSquare, targetSquare) {
    if (game.turn() !== playerColor) {
      return false; // Not player's turn
    }

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // This will only be used if it's a valid promotion move
    });

    // illegal move
    if (move === null) {
      setStatus('Illegal move, try again');
      return false;
    }
    
    checkGameStatus();
    return true;
  }

  function analyzePosition(fen) {
    setStatus("Computer is thinking...");
    fetch('http://127.0.0.1:5000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fen: fen }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.best_move) {
        makeAMove(data.best_move);
        setEvaluation(data.evaluation);
        checkGameStatus();
      } else {
        setStatus('Game over');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      setStatus('Error: Failed to get computer move');
    });
  }

  return (
    <div className="flex flex-col justify-center items-center p-4">
      <div className="mb-4 text-lg font-bold">{status}</div>
      <div className="mb-2">Evaluation: {evaluation}</div>
      <Chessboard 
        position={game.fen()} 
        onPieceDrop={onDrop} 
        boardWidth={400} 
        customSquareStyles={customSquareStyles()}
        boardOrientation={playerColor === 'w' ? 'white' : 'black'}
      />
      <div className="mt-4">
        You are playing as {playerColor === 'w' ? 'White' : 'Black'}
      </div>
      <div className="mt-2 text-sm">
        Current FEN: {fen}
      </div>
    </div>
  );
};

export default ChessBoardComponent;