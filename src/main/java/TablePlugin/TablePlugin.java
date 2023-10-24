package TablePlugin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;

public class TablePlugin extends HttpServlet {
    private static final Logger log = LoggerFactory.getLogger(TablePlugin.class);

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("text/html");

        String htmlFilePath = "/templates/TablePlugin.html";
        String cssFilePath = "/templates/TablePlugin.css"; 
        String jsFilePath = "/templates/TablePlugin.js";

        InputStream htmlResourceAsStream = getClass().getResourceAsStream(htmlFilePath);
        InputStream cssResourceAsStream = getClass().getResourceAsStream(cssFilePath);
        InputStream jsResourceAsStream = getClass().getResourceAsStream(jsFilePath);
    

        if (htmlResourceAsStream != null && cssResourceAsStream != null && jsResourceAsStream != null) {
            byte[] htmlBuffer = new byte[1024];
            byte[] cssBuffer = new byte[1024];
            byte[] jsBuffer = new byte[1024];
            
            int htmlBytesRead;
            int cssBytesRead;
            int jsBytesRead;

            StringBuilder htmlContent = new StringBuilder();
            StringBuilder cssContent = new StringBuilder();
            StringBuilder jsContent = new StringBuilder();

            while ((htmlBytesRead = htmlResourceAsStream.read(htmlBuffer)) != -1) {
                htmlContent.append(new String(htmlBuffer, 0, htmlBytesRead, "UTF-8"));
            }
        
            while ((cssBytesRead = cssResourceAsStream.read(cssBuffer)) != -1) {
                cssContent.append(new String(cssBuffer, 0, cssBytesRead, "UTF-8"));
            }
            while ((jsBytesRead = jsResourceAsStream.read(jsBuffer)) != -1) {
                jsContent.append(new String(jsBuffer, 0, jsBytesRead, "UTF-8"));
            }
        
            String finalHtmlContent = htmlContent.toString().replace("</head>", "<style>" + cssContent.toString() + "</style></head>");

            finalHtmlContent = finalHtmlContent.replace("</body>", "<script>" + jsContent.toString() + "</script></body>");
            // finalHtmlContent = finalHtmlContent.replace("</body>", "<script>" + "console.log('" + System.getProperty("baseurl") + "');" + jsContent.toString() + "</script></body>");           
            resp.getWriter().write(finalHtmlContent);
        } else {
            resp.getWriter().write("<script>");
            resp.getWriter().write("console.log('HTML or CSS file not found');");
            resp.getWriter().write("</script>");
        }
    }
}