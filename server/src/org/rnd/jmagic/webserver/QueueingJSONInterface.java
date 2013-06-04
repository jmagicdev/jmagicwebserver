package org.rnd.jmagic.webserver;

import java.io.*;
import java.util.*;

import org.rnd.jmagic.engine.*;
import org.rnd.jmagic.sanitized.*;
import org.rnd.util.*;

import com.google.gson.reflect.*;
import com.google.gson.stream.*;

public class QueueingJSONInterface implements org.rnd.jmagic.engine.PlayerInterface
{
	public static final class SanitizedGameStateAdapter extends com.google.gson.TypeAdapter<SanitizedGameState>
	{
		public static final com.google.gson.TypeAdapterFactory FACTORY = new com.google.gson.TypeAdapterFactory()
		{
			@Override
			@SuppressWarnings("unchecked")
			// we use a runtime check to make sure the 'T's equal
			public <T> com.google.gson.TypeAdapter<T> create(com.google.gson.Gson gson, TypeToken<T> typeToken)
			{
				return typeToken.getRawType() == SanitizedGameState.class ? (com.google.gson.TypeAdapter<T>)new SanitizedGameStateAdapter(gson) : null;
			}
		};

		private com.google.gson.Gson gson;

		public SanitizedGameStateAdapter(com.google.gson.Gson gson)
		{
			this.gson = gson;
		}

		@Override
		public void write(JsonWriter out, SanitizedGameState value) throws IOException
		{
			if(value == null)
			{
				out.nullValue();
				return;
			}

			out.beginObject();

			this.gson.getAdapter(new com.google.gson.reflect.TypeToken<java.util.Map<Integer, SanitizedIdentified>>()
			{
				//
			}).write(out.name("actual"), value);

			out.name("players").beginArray();
			for(Integer player: value.players)
				out.value(player);
			out.endArray();

			out.name("battlefield").value(value.battlefield);
			out.name("commandZone").value(value.commandZone);
			out.name("exileZone").value(value.exileZone);
			out.name("stack").value(value.stack);
			out.name("turn").value(value.turn);

			out.name("phase");
			if(value.phase == null)
				out.nullValue();
			else
				out.value(value.phase.name());

			out.name("step");
			if(value.step == null)
				out.nullValue();
			else
				out.value(value.step.name());

			out.endObject();
		}

		@Override
		public SanitizedGameState read(JsonReader in) throws IOException
		{
			return null;
		}
	}

	public static final class ManaPoolAdapter extends com.google.gson.TypeAdapter<ManaPool>
	{
		public static final com.google.gson.TypeAdapterFactory FACTORY = new com.google.gson.TypeAdapterFactory()
		{
			@Override
			@SuppressWarnings("unchecked")
			// we use a runtime check to make sure the 'T's equal
			public <T> com.google.gson.TypeAdapter<T> create(com.google.gson.Gson gson, TypeToken<T> typeToken)
			{
				return typeToken.getRawType() == SanitizedGameState.class ? (com.google.gson.TypeAdapter<T>)new ManaPoolAdapter(gson) : null;
			}
		};

		private com.google.gson.Gson gson;

		public ManaPoolAdapter(com.google.gson.Gson gson)
		{
			this.gson = gson;
		}

		@Override
		public void write(JsonWriter out, ManaPool value) throws IOException
		{
			this.gson.getAdapter(new com.google.gson.reflect.TypeToken<java.util.List<ManaSymbol>>()
			{
				//
			}).write(out, value.getDisplayOrder());
		}

		@Override
		public ManaPool read(JsonReader in) throws IOException
		{
			return null;
		}
	}

	@SuppressWarnings("unused")
	private static class DivideWrapper
	{
		private String func = "divide";
		private int quantity;
		private int minimum;
		private String beingDivided;
		private List<SanitizedTarget> targets;

		private DivideWrapper(int _minimum, int _quantity, String _beingDivided, List<SanitizedTarget> _targets)
		{
			this.quantity = _quantity;
			this.minimum = _minimum;
			this.beingDivided = _beingDivided;
			this.targets = _targets;
		}
	}

	@SuppressWarnings("unused")
	private static class ChooseNumberWrapper
	{
		private String func = "chooseNumber";
		private NumberRange range;
		private String description;

		private ChooseNumberWrapper(NumberRange _range, String _description)
		{
			this.range = _range;
			this.description = _description;
		}
	}

	@SuppressWarnings("unused")
	private static class ChooseWrapper<T extends Serializable>
	{
		private String func = "choose";
		private ChooseParameters<T> parameterObject;

		private ChooseWrapper(ChooseParameters<T> _parameterObject)
		{
			this.parameterObject = _parameterObject;
		}
	}

	@SuppressWarnings("unused")
	private static class AlertWaitingWrapper
	{
		private String func = "alertWaiting";
		private SanitizedPlayer who;

		private AlertWaitingWrapper(SanitizedPlayer _who)
		{
			this.who = _who;
		}
	}

	@SuppressWarnings("unused")
	private static class AlertStateReversionWrapper
	{
		private String func = "alertStateReversion";
		private ReversionParameters parameters;

		private AlertStateReversionWrapper(ReversionParameters _parameters)
		{
			this.parameters = _parameters;
		}
	}

	@SuppressWarnings("unused")
	private static class AlertStateWrapper
	{
		private String func = "alertState";
		private SanitizedGameState sanitizedGameState;

		private AlertStateWrapper(SanitizedGameState _sanitizedGameState)
		{
			this.sanitizedGameState = _sanitizedGameState;
		}
	}

	@SuppressWarnings("unused")
	private static class AlertEventWrapper
	{
		private String func = "alertEvent";
		private SanitizedEvent event;

		private AlertEventWrapper(SanitizedEvent _event)
		{
			this.event = _event;
		}
	}

	@SuppressWarnings("unused")
	private static class AlertChoiceWrapper
	{
		private String func = "alertChoice";
		private int playerID;
		private ChooseParameters<?> choice;

		private AlertChoiceWrapper(ChooseParameters<?> _choice, int _playerID)
		{
			this.playerID = _playerID;
			this.choice = _choice;
		}
	}

	@SuppressWarnings("unused")
	private static class AlertErrorWrapper
	{
		private String func = "alertError";
		private String errorType;
		private ErrorParameters parameters;

		private AlertErrorWrapper(ErrorParameters _parameters)
		{
			this.errorType = _parameters.getClass().getSimpleName();
			this.parameters = _parameters;
		}
	}

	@SuppressWarnings("unused")
	private static class GetDeckWrapper
	{
		private String func = "getDeck";
	}

	@SuppressWarnings("unused")
	private static class GetNameWrapper
	{
		private String func = "getName";
	}

	@SuppressWarnings("unused")
	private static class SetPlayerIDWrapper
	{
		private String func = "setPlayerID";
		private int playerID;

		private SetPlayerIDWrapper(int _playerID)
		{
			this.playerID = _playerID;
		}
	}

	private static final java.lang.reflect.Type LIST_INTEGER_TYPE = new TypeToken<List<Integer>>()
	{
		//
	}.getType();

	private com.google.gson.Gson gson;
	private java.util.concurrent.BlockingQueue<String> messageQueue;
	private java.util.concurrent.BlockingQueue<String> responseQueue;

	public QueueingJSONInterface()
	{
		com.google.gson.GsonBuilder builder = new com.google.gson.GsonBuilder();
		builder.registerTypeAdapterFactory(SanitizedGameStateAdapter.FACTORY);

		this.gson = builder.create();
		this.messageQueue = new java.util.concurrent.LinkedBlockingDeque<String>();
		this.responseQueue = new java.util.concurrent.SynchronousQueue<String>(true);
	}

	@Override
	public void alertChoice(final int _playerID, final ChooseParameters<?> _choice)
	{
		String json = this.gson.toJson(new AlertChoiceWrapper(_choice, _playerID));
		this.messageQueue.add(json);
	}

	@Override
	public void alertError(final ErrorParameters _parameters)
	{
		String json = this.gson.toJson(new AlertErrorWrapper(_parameters));
		this.messageQueue.add(json);
	}

	@Override
	public void alertEvent(final SanitizedEvent _event)
	{
		String json = this.gson.toJson(new AlertEventWrapper(_event));
		this.messageQueue.add(json);
	}

	@Override
	public void alertState(final SanitizedGameState _sanitizedGameState)
	{
		String json = this.gson.toJson(new AlertStateWrapper(_sanitizedGameState));
		this.messageQueue.add(json);
	}

	@Override
	public void alertStateReversion(final ReversionParameters _parameters)
	{
		String json = this.gson.toJson(new AlertStateReversionWrapper(_parameters));
		this.messageQueue.add(json);
	}

	@Override
	public void alertWaiting(final SanitizedPlayer _who)
	{
		String json = this.gson.toJson(new AlertWaitingWrapper(_who));
		this.messageQueue.add(json);
	}

	@Override
	public <T extends Serializable> List<Integer> choose(final ChooseParameters<T> _parameterObject)
	{
		String json = this.gson.toJson(new ChooseWrapper<T>(_parameterObject));
		this.messageQueue.add(json);

		try
		{
			json = this.responseQueue.take();
			return this.gson.fromJson(json, LIST_INTEGER_TYPE);
		}
		catch(InterruptedException e)
		{
			return null;
		}
	}

	@Override
	public int chooseNumber(final NumberRange _range, final String _description)
	{
		String json = this.gson.toJson(new ChooseNumberWrapper(_range, _description));
		this.messageQueue.add(json);

		try
		{
			json = this.responseQueue.take();
			return this.gson.fromJson(json, int.class);
		}
		catch(InterruptedException e)
		{
			return 0;
		}
	}

	@Override
	public void divide(final int _quantity, final int _minimum, final int _whatFrom, final String _beingDivided, final List<SanitizedTarget> _targets)
	{
		String json = this.gson.toJson(new DivideWrapper(_minimum, _quantity, _beingDivided, _targets));
		this.messageQueue.add(json);
	}

	@Override
	public Deck getDeck()
	{
		String json = this.gson.toJson(new GetDeckWrapper());
		this.messageQueue.add(json);

		try
		{
			json = this.responseQueue.take();
			String[] cards = this.gson.fromJson(json, new com.google.gson.reflect.TypeToken<String[]>()
			{
				//
			}.getType());

			Deck deck = new Deck();

			for(String card: cards)
				deck.addCard(card);

			return deck;
		}
		catch(InterruptedException e)
		{
			return new Deck();
		}
	}

	@Override
	public String getName()
	{
		String json = this.gson.toJson(new GetNameWrapper());
		this.messageQueue.add(json);

		try
		{
			json = this.responseQueue.take();
			json = this.gson.fromJson(json, String.class);
			return json;
		}
		catch(InterruptedException e)
		{
			return "Player";
		}

	}

	@Override
	public void setPlayerID(int playerID)
	{
		String json = this.gson.toJson(new SetPlayerIDWrapper(playerID));
		this.messageQueue.add(json);
	}

	public String getNextMessage(int timeout, java.util.concurrent.TimeUnit unit)
	{
		try
		{
			String poll = this.messageQueue.poll(timeout, unit);
			// Remove any consecutive identical messages
			if(poll != null)
			{
				while(poll.equals(this.messageQueue.peek()))
					this.messageQueue.poll();
				java.util.logging.Logger.getAnonymousLogger().log(java.util.logging.Level.INFO, "Send Message: " + poll);
			}
			return poll;
		}
		catch(InterruptedException e)
		{
			return null;
		}
	}

	public void registerResponse(String response)
	{
		java.util.logging.Logger.getAnonymousLogger().log(java.util.logging.Level.INFO, "Register Response: " + response);
		this.responseQueue.add(response);
	}

}
