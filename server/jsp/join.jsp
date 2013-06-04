<%@ page %>
<%
  String callback = request.getParameter("callback");
  if (callback != null) {
    response.setContentType("application/javascript");
    out.println(callback);
    out.println("(");
  } else {
    response.setContentType("application/json");
  }
  
  java.util.UUID key = (java.util.UUID)session.getAttribute("org.rnd.jmagic.webserver.JspServer.key");
  if (key != null) {
    org.rnd.jmagic.webserver.JspServer server = org.rnd.jmagic.webserver.JspServer.getServer(key);
    if (server == null) {
      key = null;
    }
  }
  
  if (key == null) {
    String keyParam = request.getParameter("key");
    if (keyParam != null) {
      try {
        key = java.util.UUID.fromString(keyParam);
        org.rnd.jmagic.webserver.JspServer.joinGame(key);
        out.println("{status:\"Game joined.\"}");
        session.setAttribute("org.rnd.jmagic.webserver.JspServer.key", key);
      } catch (IllegalArgumentException e) {
        out.println("{error:\"Invalid or malformed key.\"}");
      }
    } else {
      out.println("{error:\"Missing key.\"}");
    }
  } else {
    out.println("{error:\"User already in a game.\"}");
  }
  if (callback != null) {
    out.println(");");
  }
%>
