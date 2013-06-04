<%@ page %>
<%!
  static class KeyObject
  {
    private java.util.UUID _keyOne;
    private java.util.UUID _keyTwo;
    
    public KeyObject(java.util.UUID keyOne, java.util.UUID keyTwo)
    {
      this._keyOne = keyOne;
      this._keyTwo = keyTwo;
    }
  }

  String printKeys(java.util.UUID keyOne, java.util.UUID keyTwo)
  {
    com.google.gson.Gson gson = new com.google.gson.Gson();
    return gson.toJson(new KeyObject(keyOne, keyTwo));
  }
%>
<%
  String callback = request.getParameter("callback");
  if (callback != null) {
    response.setContentType("application/javascript");
    out.println(callback);
    out.println("(");
  } else {
    response.setContentType("application/json");
  }
  String clear = request.getParameter("clear");
  if (clear != null) {
    if ("y".equals(clear)) {
      session.setAttribute("org.rnd.jmagic.webserver.JspServer.key", null);
    } else if("all".equals(clear)) {
      session.setAttribute("org.rnd.jmagic.webserver.JspServer.key", null);
      org.rnd.jmagic.webserver.JspServer.clearAllGames();
    }
  }
  
  java.util.UUID key = (java.util.UUID)session.getAttribute("org.rnd.jmagic.webserver.JspServer.key");
  
  if (key != null) {
    org.rnd.jmagic.webserver.JspServer server = org.rnd.jmagic.webserver.JspServer.getServer(key);
    if (server == null) {
      key = null;
    }
  }

  if (null == key) {
    key = org.rnd.jmagic.webserver.JspServer.createKey();
    session.setAttribute("org.rnd.jmagic.webserver.JspServer.key", key);
    java.util.UUID otherKey = org.rnd.jmagic.webserver.JspServer.createGame(key);
    out.println(printKeys(key, otherKey));
  } else {
    java.util.UUID otherKey = org.rnd.jmagic.webserver.JspServer.getOtherKey(key);
    out.println(printKeys(key, otherKey));
  }
  if (callback != null) {
    out.println(");");
  }
%>
