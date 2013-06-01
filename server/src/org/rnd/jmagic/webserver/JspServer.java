package org.rnd.jmagic.webserver;

import org.rnd.jmagic.engine.*;

public class JspServer
{
	private static final java.util.Map<Object, JspServer> _games = new java.util.HashMap<Object, JspServer>();

	private static final Thread cardLoader = new Thread()
	{
		@Override
		public void run()
		{
			org.rnd.jmagic.CardLoader.addPackages("org.rnd.jmagic.cards");
		}
	};

	{
		startLoadingCards();
	}

	public static void startLoadingCards()
	{
		synchronized(cardLoader)
		{
			if(cardLoader.getState() == java.lang.Thread.State.NEW)
				cardLoader.start();
		}
	}

	public static int numGames()
	{
		synchronized(_games)
		{
			return _games.size();
		}
	}

	public static java.util.UUID createKey()
	{
		return java.util.UUID.randomUUID();
	}

	// Instantiates a two-player game with the current players key and output
	// writer. Returns a key for use by the second player to join the game.
	public static java.util.UUID createGame(final java.util.UUID key)
	{
		startLoadingCards();
		while(cardLoader.getState() != java.lang.Thread.State.TERMINATED)
			try
			{
				cardLoader.join(5000);
			}
			catch(InterruptedException e)
			{
				//
			}

		final Game game = new Game(GameTypes.OPEN);

		final java.util.UUID otherKey = createKey();
		final JspServer server = new JspServer(game);

		final QueueingJSONInterface json = new QueueingJSONInterface();
		server.addPlayer(key, json);
		server.addPlayer(otherKey, new QueueingJSONInterface());

		synchronized(_games)
		{
			_games.put(key, server);
			_games.put(otherKey, server);
		}

		// Adding the interface will immediately ask the player some questions
		// (name/deck), so put that in another thread so it doesn't hold up this
		// thread.
		new Thread()
		{
			@Override
			public void run()
			{
				org.rnd.jmagic.engine.PlayerInterface local = json;
				local = new org.rnd.jmagic.interfaceAdapters.MulticostAdapter(local);
				// local = new
				// org.rnd.jmagic.interfaceAdapters.AutomaticPassInterface(local);
				local = new org.rnd.jmagic.interfaceAdapters.ShortcutInterface(local);
				local = new org.rnd.jmagic.interfaceAdapters.ManaAbilitiesAdapter(local);
				game.addInterface(local);
			}
		}.start();

		return otherKey;
	}

	// Joins a game based on a key provided to the player.
	public static void joinGame(final java.util.UUID key) throws GameDoesNotExistException
	{
		final JspServer server;

		synchronized(_games)
		{
			if(!_games.containsKey(key))
				throw new GameDoesNotExistException();

			server = _games.get(key);
		}

		synchronized(server)
		{
			final Game game = server.getGame();

			// Add the interface and start the game in another thread so that we
			// can complete the joinGame request, while the game asks the player
			// for their name/deck/etc.
			Thread gameThread = new Thread(new Runnable()
			{
				@Override
				public void run()
				{
					QueueingJSONInterface json = server.getPlayer(key);
					org.rnd.jmagic.engine.PlayerInterface local = json;
					local = new org.rnd.jmagic.interfaceAdapters.MulticostAdapter(local);
					// local = new
					// org.rnd.jmagic.interfaceAdapters.AutomaticPassInterface(local);
					local = new org.rnd.jmagic.interfaceAdapters.ShortcutInterface(local);
					local = new org.rnd.jmagic.interfaceAdapters.ManaAbilitiesAdapter(local);
					game.addInterface(local);

					game.run();
				}
			});

			server.setGameThread(gameThread);
			gameThread.start();
		}
	}

	public static java.util.UUID getOtherKey(java.util.UUID key)
	{
		synchronized(_games)
		{
			if(_games.containsKey(key))
			{
				JspServer server = _games.get(key);
				synchronized(server)
				{
					return server.getOtherPlayer(key);
				}
			}
		}
		return null;
	}

	public static void clearAllGames()
	{
		synchronized(_games)
		{
			for(JspServer server: _games.values())
				synchronized(server)
				{
					if(server.getGameThread() != null)
						server.getGameThread().interrupt();
				}
			_games.clear();
		}
	}

	public static JspServer getServer(java.util.UUID key)
	{
		synchronized(_games)
		{
			return _games.get(key);
		}
	}

	public static class GameDoesNotExistException extends Exception
	{
		private static final long serialVersionUID = 1L;
	}

	private org.rnd.jmagic.engine.Game _game = null;
	private java.util.Map<java.util.UUID, QueueingJSONInterface> _players;
	private Thread _gameThread = null;

	public JspServer(Game game)
	{
		this._game = game;
		this._players = new java.util.HashMap<java.util.UUID, QueueingJSONInterface>();
		this._gameThread = null;
	}

	public Game getGame()
	{
		return this._game;
	}

	public void setGameThread(Thread gameThread)
	{
		this._gameThread = gameThread;
	}

	public Thread getGameThread()
	{
		return this._gameThread;
	}

	public void addPlayer(java.util.UUID key, QueueingJSONInterface player)
	{
		this._players.put(key, player);
	}

	public QueueingJSONInterface getPlayer(java.util.UUID key)
	{
		return this._players.get(key);
	}

	public java.util.UUID getOtherPlayer(java.util.UUID key)
	{
		for(java.util.UUID playerKey: this._players.keySet())
			if(!playerKey.equals(key))
				return playerKey;
		return null;
	}
}
