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
  if (key != null)
  {
    org.rnd.jmagic.webserver.JspServer server = org.rnd.jmagic.webserver.JspServer.getServer(key);
    if (server == null) {
      out.println("{error:\"Game has expired.\"}");
    } else {
      org.rnd.jmagic.webserver.QueueingJSONInterface json = server.getPlayer(key);
      String responseString = request.getParameter("response");
      if (responseString == null) {
        out.println("{error:\"No response given.\"}");
      } else {
        json.registerResponse(responseString);
      }
    }
  } else {
    out.println("{error:\"User not currently in a game\"}");
  }
  if (callback != null) {
    out.println(");");
  }
%>
