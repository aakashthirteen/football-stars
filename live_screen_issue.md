Debugging the Live Match Screen Transition Issue
Understanding the SSE Timer Workflow
When the "Start Match" button is clicked, the system should transition from the scheduled pre-match view to the live match view. Under the hood, the following steps occur in the Server-Sent Events (SSE) timer workflow:
Server-side: The backend marks the match as live in the database and begins the timer. In code, the startMatch function updates the match status to "LIVE"
GitHub
 and immediately broadcasts a timer update (status_change event) to all connected SSE clients
GitHub
. This means the server is indeed sending an event like “Match started! ⚽” as soon as the match starts.
Client-side: The React Native app uses an EventSource (with a polyfill) to listen for SSE updates. The useMatchTimer hook sets up an EventSource connection to the /timer-stream endpoint for the match. It defines handlers for incoming messages – on each message, handleSSEUpdate is called to update the timer state in React state
GitHub
. This should update timerState.status to "LIVE" as soon as the initial status_change event arrives. The UI is written to show the live match view whenever the timer status or match status is live.
UI Transition Logic: In the MatchScoringScreenSSE component, a piece of state showLiveView controls whether to display the live match interface or the pre-match interface. As soon as a match start is requested, the code sets a flag matchStartRequested to true and immediately forces showLiveView to true
GitHub
GitHub
. This is intended to immediately switch the UI to the live view (showing the scoreboard timer, action buttons, etc.) even before the first SSE update arrives. The code logs confirm this: “✅ Match start requested - showing live screen immediately” is printed and showLiveView flips from false to true
GitHub
.
In summary, the server does send the SSE event on match start, the client does have an onmessage handler to process it, and the app does attempt to switch to the live view right away. All of these were verified by reviewing the code and logs:
Server broadcasts on start – confirmed by this.broadcastUpdate(matchId, 'status_change', 'Match started! ⚽') being called in the backend
GitHub
.
Client onmessage updates state – confirmed by the eventSource.onmessage handler calling handleSSEUpdate to set status and time
GitHub
.
Database status update – confirmed by database.updateMatch(matchId, { status: 'LIVE', ... }) in the backend
GitHub
, so the match status in the DB becomes LIVE as expected.
Observations from the Logs
Despite the above, your logs showed a discrepancy in behavior:
The API response to starting the match indicated success and the timer state returned with "status": "LIVE" (so the backend thinks the match is live).
A subsequent reload of match data also showed the match status as "LIVE" in the JSON.
However, the UI’s timer state remained "SCHEDULED", and the debug log printed connectionStatus: "error" for the SSE connection. After 10 seconds, a warning “⚠️ SSE: Connection timeout after 10 seconds” appeared, meaning the client never established the SSE connection.
In other words, the server did everything correctly (started the match, updated the DB, and sent SSE events), but the front-end never received those SSE updates. The client’s EventSource did not connect, leaving the timer in the initial state (status: "SCHEDULED"). This is precisely summarized in the SSE Connection Fix notes: “the SSE connection is not establishing... the frontend timer stays at status: "SCHEDULED" because the SSE connection fails.”
GitHub
. The app’s view logic uses the timer status to decide what to display, so if it stays "SCHEDULED", parts of the UI will still appear as if the match never started (e.g. the header might still show “Scheduled” instead of the live clock). Notably, your View Decision log confirms the mismatch: it decided willShowLiveView: true (because you set matchStartRequested true)
GitHub
, and the live view was indeed toggled on (“LIVE VIEW STATE CHANGED: false → true”
GitHub
). This means the Start Match card was replaced by the live match interface. So the screen did technically “transition” to the live layout container. But because the SSE data wasn’t coming in, the live view was incomplete – the timer display likely still showed "Scheduled" or 00:00 with no progression, and no live indicators. In other words, the shell of the live screen was up, but it wasn’t updating as expected.
Root Cause: SSE Connection Failure
The core issue is that the SSE connection was never successfully established between the app and the server, so the front-end did not get the real-time updates (in particular, the event that sets the status to LIVE and starts the timer). From the client logs, we see the EventSource attempted to connect but ultimately hit an error state. The React Native environment adds complexity here: by default, RN doesn’t support EventSource, so you must use a polyfill or alternative. Your code is written to handle this by trying two methods in connectSSE():
EventSource with custom headers – The code first tries to instantiate new EventSource(url, { headers: { Authorization: Bearer ${token}, ...} }). This likely fails in React Native (since standard EventSource doesn’t accept a headers option), and indeed your logs show “⚠️ SSE: Headers not supported, trying query parameter method”
GitHub
.
EventSource with token query param – Next it falls back to new EventSource(fallbackUrl) where the URL is appended with ?token=<JWT>
GitHub
. This is the correct approach given your server’s SSE auth middleware supports a token query param
GitHub
. The log “✅ SSE: EventSource created with query parameter auth” indicates this was successful in creating the EventSource object
GitHub
.
After that, we should see the onopen handler fire, which would log a success message and set connectionStatus: 'connected'. In the logs provided earlier, this never happened – instead the connection stayed in a pending state until timing out. This suggests that one of two things occurred:
The request to the SSE endpoint never actually reached or was handled by the server, or
The response was opened but no events were delivered, causing the client to sit waiting.
The most likely culprit is that the SSE endpoint was not functioning or reachable in the production environment. In your Railway deployment, perhaps the SSE routes were not included or there was a routing issue. It’s notable that the SSE endpoint is defined under /api/sse/:id/timer-stream on the backend. The debug plan in the notes points out as the first possible issue: “SSE routes not deployed – The /api/matches/:id/timer-stream endpoint doesn’t exist on Railway”
GitHub
. In other words, if the deployed backend wasn’t updated with the SSE route code, the client’s EventSource connection would never actually establish (likely getting a 404 or no response, which in SSE land can appear as a silent failure). Other potential factors could be:
CORS or headers issues: The server code does set Access-Control-Allow-Origin: '*') for the SSE route
GitHub
, so CORS is likely open. Auth should be handled via the token query param which your code provided. So those are less likely to be the issue if the route is indeed running.
Polyfill limitations: Ensure that the library or polyfill you use for EventSource in React Native is properly installed and working. The logs did show typeof EventSource !== 'undefined' was true, meaning the polyfill was present. It successfully created an EventSource, so it seems the polyfill is in place. The problem was not the creation of the object, but the connection handshake itself.
Networking issues: If using a simulator or device, ensure it can reach the Railway URL. If on Android emulator, for example, sometimes localhost or network configs cause issues – but since other API calls (match start, etc.) succeeded, the device clearly can reach the server.
Solution Steps
To resolve the issue, we need to get the SSE connection working properly. Based on the analysis and the provided “SSE Timer Connection Fix” guide, here are the steps to take:
Verify SSE Endpoint Deployment: First, confirm that your Railway deployment actually includes the SSE routes and that they are accessible. A quick test is to use curl from your local machine or a tool like Postman to hit the SSE test endpoint your server provides. For example:
bash
Copy
curl -N https://football-stars-production.up.railway.app/api/sse/test 
(The -N flag keeps the connection open to simulate an SSE client.) This endpoint doesn’t require auth and should stream test events. If you get a 404 Not Found or no response, it means the SSE routes are not active on the server
GitHub
. In that case, make sure you have merged and deployed the latest code. Commit any missing changes related to SSE (the routes in sse.ts, the SSE service, etc.) and redeploy your server
GitHub
GitHub
. After deployment, test again until you receive a proper SSE response (you should see a JSON message with "message": "SSE test connection established!" and periodic heartbeat events).
Check the SSE Auth Token: Since the client passes the JWT as a query parameter in fallback mode, ensure that:
The token is correct (not expired, and corresponds to the user authorized for that match). The logs show the token was indeed retrieved from AsyncStorage and appended, which is good.
The server’s sseAuthenticate middleware is accepting the token. Your middleware looks for req.query.token if no Authorization header
GitHub
, which is exactly what we’re using. If the token were invalid, the server would respond with 401 Unauthorized and the EventSource onerror would trigger quickly. In the logs, we didn’t see an immediate 401; instead it hung. This implies the connection wasn’t outright rejected by auth (or that the request maybe never fully went through). Once the SSE route is confirmed deployed, if you still have issues, double-check that the Authorization header or token query param is being processed correctly. (One trick: try hitting the /api/sse/{matchId}/timer-stream?token=... URL in a browser after logging in – it should keep the connection open. Or log server-side whether sseAuthenticate is firing.)
React Native SSE Polyfill: Make sure you’re using a reliable SSE polyfill for React Native. The code logs mention “EventSource constructor available”, so presumably you have something like event-source-polyfill or a similar package. If the connection still doesn’t open, consider using an alternative like react-native-eventsource or even switching to a WebSocket approach as a fallback. Since you already have a WebSocket mechanism (the code in MatchScoringScreen.tsx for example), one quick workaround is to set USE_SSE_TIMER: false in the config and use the WebSocket service until SSE is stable
GitHub
. However, ideally we want SSE to work as intended.
Implement a Fallback Timer (temporary): As suggested in the guidance, you can add a fallback in the UI so that if the match is started but SSE hasn’t connected yet, the app still shows the timer as running. The provided snippet does exactly this – it manually sets the timer state to LIVE and computes an approximate current time based on the match start time from the match data
GitHub
GitHub
. This ensures the UI isn’t stuck on "Scheduled" in those first seconds. You mentioned the “SSE counter seems to be working” after your script changes, which likely means you added something like this. That’s good as an interim fix, but keep in mind it’s just a local estimation. You should still fix the underlying SSE connection so that it remains in sync with the server and receives real-time events (for halftime, fulltime, etc.).
Confirm the UI Updates: Once the SSE connection issue is resolved, the front-end should receive the status_change event and update timerState.status to "LIVE". The header will then display the running clock instead of “Scheduled” (the ProfessionalMatchHeader shows MM:SS when status is LIVE
GitHub
). Also, the live indicators (like the “LIVE” badge and the moving progress bar in the header) will activate because isLive becomes true
GitHub
GitHub
. You should see the Start button disappear (it already does) and the header/timer reflect the live status. If you were viewing the Formation tab or another tab, you may need to switch to the Actions or Commentary tab to see the live events and timer. The app doesn’t automatically change the selected tab on match start – it just makes the live components available. So ensure you’re looking at the portion of the UI that shows the timer (by default it’s the “Actions” tab).
By following the above steps, you will address the root cause of the screen not fully transitioning. In short, fix the SSE connection between the app and server. Once the SSE stream is connected and delivering events, the UI will update the match status and timer as intended, completing the transition to the live match screen.