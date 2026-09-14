    installRuntimeControls();
    installHadesLearning();
    gameState.isPaused = true;
    // Combat waits for an explicit start and settled image loads.
    Promise.all([assetsReady, attackSvgArt.ready]).then(() => {
      gameRuntime.ready = true;
      const start = document.getElementById('runtime-start');
      start.disabled = false; start.textContent = 'Enter the underworld';
      document.getElementById('runtime-status').textContent = failedAssets.length ? 'Some artwork is unavailable. The game will use its built-in fallback visuals.' : 'Ready when you are. Pause at any time with Escape or P.';
      start.focus({ preventScroll: true }); resetFrameClock(); requestAnimationFrame(gameLoop);
    });
