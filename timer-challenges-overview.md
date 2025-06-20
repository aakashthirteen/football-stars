Understanding the SSE Connection Issue
Recap of the Current Situation
You have implemented Server-Sent Events (SSE) in your app and made several script changes, but the SSE connection still isn’t accessible from the React Native client. The logs you provided show the following sequence when testing the SSE endpoints from the app:
The app attempts to open an EventSource to the SSE test endpoint.
Debug logs confirm the EventSource polyfill (RNEventSource) is loaded (showing as a function).
The EventSource is created, but no onopen event fires within 8 seconds, leading to a “Connection timeout” message
GitHub
.
A subsequent fetch to the SSE health endpoint returns a JSON response indicating “SSE routes are working” (HTTP 200 OK).
Finally, the test SSE connection is auto-closed after 15 seconds by your client code.
In summary, the SSE health check succeeds (proving the server routes are up), but the SSE stream connection doesn’t establish (timing out instead of opening).
Server-Side SSE Endpoint Verification
On the server (Railway), the SSE endpoints appear correctly set up:
/api/sse/health: A simple HTTP GET that returns a JSON { success: true, message: "SSE routes are working", ... } and is not protected by auth. Your logs show this returns 200 OK, confirming the route is deployed and reachable.
/api/sse/test: A test SSE stream (no auth) that should keep a connection open and send periodic events. The server code for this endpoint sets the appropriate SSE headers (Content-Type, Cache-Control, Connection keep-alive) and CORS headers. Notably, it allows any origin (Access-Control-Allow-Origin: *) and permits the Cache-Control header in requests
GitHub
. This means CORS is not likely blocking the request. On connection, the server logs should show messages like “Client connected to test endpoint” and it will immediately send an initial SSE message followed by heartbeats every 2 seconds
GitHub
GitHub
.
/api/sse/:id/timer-stream: The real match timer SSE endpoint (requires auth via sseAuthenticate middleware). This route also sets proper SSE and CORS headers (including allowing Authorization headers)
GitHub
. In your implementation, the client adds the JWT token as a query parameter (?token=) to avoid issues with custom headers, which the server’s auth middleware should handle. So, once the basic SSE connection works, auth should not be a blocker for the timer stream.
What to check on the server logs: When you trigger the SSE test from the app, see if the Railway logs show the connection. You should expect logs like “🧪 SSE Test: Client connected…” if the request reaches the Express server
GitHub
. If no such log appears during your app test, it means the SSE HTTP request never actually hit your server – pointing to a client-side issue or network proxy issue before the request can connect.
Client-Side Considerations (React Native + Expo)
On the client side, you’re using React Native (Expo) with the react-native-event-source polyfill. The logs confirm global.EventSource is set to the RNEventSource constructor, so the polyfill is initialized correctly. The fact that you see EventSource type: function and no “EventSource not available” error means the setup in App.tsx (importing and assigning RNEventSource to global) was successful. Key observation: The EventSource in the app never transitions to the OPEN state. We don’t see the log “✅ SSE Test: Connection opened” from eventSource.onopen in your output, meaning onopen was never called before the 8-second timeout
GitHub
. This suggests that the HTTP stream either:
Never successfully connected to the server OR
Connected but the client did not receive the expected stream data to trigger onopen.
Given that opening the same SSE URL in a browser works (no 404, and presumably it streams events), the server is functioning. The difference must be in the client environment. Two main areas to examine:
1. Expo Dev Mode Network Interception
Since you are testing on Expo (the user-agent in the health check includes Expo/… CFNetwork Darwin), a known issue can interfere with SSE in development mode. Expo’s debugging network interceptor can block SSE responses in debug builds. In fact, Expo’s ExpoRequestCdpInterceptor tries to peek at response bodies for the DevTools, which is incompatible with streaming responses like SSE
github.com
. The result is that Server-Sent Events do not get through in Expo’s debug environment
github.com
. This is a documented Expo issue: “SSE (EventSource) are not getting through while app is in debug variant.” The interceptor reads the stream and prevents events from reaching the JS runtime, unless patched
github.com
. Implication: If you are running the app in Expo Go or an Expo dev build, SSE streams may be blocked by the debug middleware. This would explain why your server sees no connection or why the client doesn’t get onopen – the stream is essentially hijacked or never properly established in debug mode. Expo merged a fix for this issue in mid-2024, but if your project is on SDK 50 or an affected version, you might still encounter the bug
github.com
.
2. React Native EventSource Polyfill Behavior
The react-native-event-source library is based on @remy’s EventSource polyfill and, being a purely JS implementation, it relies on the native networking APIs under the hood. Some things to note:
No built-in reconnection logic in debug logs: We see the manual timeout and close in your SSETestButton component. The library itself likely doesn’t report an error; it’s your code timing out. If Expo’s interceptor blocked the stream, the request might be stalled. The polyfill’s readyState showing as undefined initially is peculiar (we’d expect 0 = CONNECTING). It could be that the polyfill doesn’t set it until later, or it’s a quirk of RNEventSource.
Headers and CORS: The test endpoint doesn’t require any special headers or auth, and your server allows Cache-Control and uses Access-Control-Allow-Origin: *
GitHub
. The polyfill by default likely sends a simple GET with Accept: text/event-stream. (If it didn’t, the server still responds as SSE regardless.) So CORS is likely not the culprit, especially since the health check (regular GET) succeeded and the SSE test works in browser. There’s no evidence of a CORS preflight failing.
Auth for protected endpoint: Though not directly causing the current failure (since /sse/test needs no auth), keep in mind for the real timer endpoint you append ?token=<JWT> in the URL
GitHub
. This avoids custom header issues. Ensure the token query param approach matches what sseAuthenticate expects (likely it checks req.query.token or similar). This approach is correct given the RNEventSource polyfill doesn’t easily allow custom Authorization headers without a separate config.
Diagnosing the Root Cause
From the above, the strongest suspect is the Expo development environment blocking the SSE. To confirm this:
Check Railway Logs for /sse/test: Did a client connection log appear when you pressed “Test SSE Connection” in the app? If no logs at all, it means the request never fully reached your server. This aligns with the Expo debug interception problem (the request might be opened by the native layer but never completed/handed off). If you do see logs of a client connecting and even heartbeats being sent from the server, then the client’s JS is not receiving the events – also likely due to the interceptor consuming them. In either case, the behavior points to the Expo debug issue rather than your code or Railway.
Railway Proxy: Railway generally supports SSE out-of-the-box (especially with the X-Accel-Buffering: no header you set to disable buffering). The fact that the SSE test works via browser and the health endpoint works via fetch indicates Railway is not blocking SSE. So we can rule out a proxy issue on Railway’s side.
Timing vs. onopen: Your app logged “⏰ SSE Test: Connection timeout” after 8 seconds
GitHub
. The code set this timeout to close the connection if onopen hasn’t fired in that time. In a normal scenario, the server’s immediate send of an initial message
GitHub
 should trigger the client’s onmessage (or at least onopen) quickly. The fact that 8 seconds passed with nothing suggests the client never got that first event. Again, this is consistent with the Expo dev issue or a network hang-up.
Next Steps and Solutions
1. Test in Production Mode (Disable Expo Debug): A quick way to verify the cause is to run your app in production mode. For Expo, you can start it without remote debugging and in production JS mode. For example, run expo start --no-dev --minify, or in the Expo Go app shake the device and toggle off “Debug JS Remotely” and enable “Production mode”. This will remove the development network interception. Then try the SSE connection again. If it connects successfully (you should see “✅ SSE Test: Connection opened” in logs and maybe an initial message event), that confirms the Expo debug interceptor was the culprit. In production mode, SSE should work since the devtools aren’t sniffing the response. 2. Update Expo SDK (if applicable): If you’re on an older Expo SDK, consider upgrading to the latest version. The SSE blocking issue in Expo’s network layer was addressed in a patch merged around June 28, 2024
github.com
. Newer SDK versions (SDK 51+, and certainly SDK 52/53 if available) include this fix. Upgrading Expo might remove the need for the above workaround and let you develop with SSE in debug mode. Always refer to Expo’s release notes for any mention of SSE fixes. 3. Use a Custom Dev Client or Bare Workflow: If immediate upgrading is not feasible, another approach is to create a custom development build of your app (using EAS Build) with the react-native-event-source library included. Expo Go (the standard client) might not include this native module by default if it had any native code. However, since react-native-event-source appears to be pure JavaScript, Expo Go can run it. The main interference was the debug network layer. A custom dev client built with Expo Config Plugins (if needed) or switching to the bare React Native CLI could avoid some Expo-specific constraints. This is more involved, so try the easier checks first. 4. Monitor Actual SSE Events: Once you get past the connection issue, keep an eye on the content of events:
The test endpoint sends a JSON like {"message":"SSE test connection established!", "type":"connection", ...} as the first event
GitHub
. Your onmessage handler should log this. In the SSETestButton, it tries to JSON.parse(event.data) and update status
GitHub
. You should see a “📨 SSE Test: Message received: …” log if onmessage fires.
For the real /timer-stream endpoint, on a successful connection you’ll get an initial "type":"connection" event and possibly an "initial_state" event immediately
GitHub
GitHub
. Ensure your useMatchTimer hook handles those (it looks like it parses any incoming message as JSON and then calls handleSSEUpdate for state updates).
5. Double-Check Middleware for Timer Stream: Since the match timer stream requires auth, make sure the sseAuthenticate middleware is not rejecting the request. You chose to send the token via query param. Verify on the server side that sseAuthenticate checks req.query.token. If it was expecting an Authorization header, you might need to adjust it to read from the query or alter your approach. The logs on server would show if an unauthorized attempt was blocked. From your earlier summary, it sounds like you intentionally bypassed the header requirement by using the query token method (the comment in code notes “React Native EventSource doesn't support custom headers properly”
GitHub
). This is fine as long as the server knows to honor it. 6. Temporary Fallbacks: In case you cannot get SSE working immediately in the client (for example, if you need time to upgrade Expo or figure out the environment), you have a couple of options:
Use the fallback timer logic you implemented (updating the timer state from match start time if SSE is not connected). This ensures the UI isn’t completely broken while you sort out SSE. It seems you already prepared such a fallback in the MatchScoringScreenSSE (as suggested in your fix guide).
Revert to WebSocket temporarily by toggling the feature flag (if TIMER_CONFIG.USE_SSE_TIMER exists)
GitHub
. Since your backend still likely has the old WebSocket service, you could use it until SSE is confirmed working. This is more of a last resort, since SSE on Railway is preferable and you’re very close to getting it working.
7. Further Debugging: If after disabling Expo debug mode the SSE still doesn’t connect, consider the following:
Test on a different platform (if you were using iOS, try Android, or vice versa) to see if behavior differs. The Expo issue was more pronounced on Android, but it’s good to compare.
Use device logs or proxy tools to see if the HTTP request to /api/sse/test is being made. For example, you could intercept traffic with a proxy (like using expo-network-profiler or a tool like Wireshark on the simulator) to confirm the GET request goes out.
Ensure that API_BASE_URL is exactly the same domain as what works in curl/browser. (It looks correct in your logs.)
Although unlikely, confirm that no firewall or corporate network setting is cutting off the event stream. Some environments might kill long-held HTTP connections. Testing on a different network or using a VPN can rule this out. Since the browser test worked on presumably the same network, this is probably fine.
Conclusion
All evidence points to the client-side environment as the reason the SSE connection is not opening. The Expo development mode’s network inspector is a known culprit for SSE issues, causing the behavior you’re seeing where the connection silently fails in debug mode
github.com
. The server is configured correctly (CORS open, SSE headers set, routes deployed) and the endpoint is reachable (health check passes, browser can connect). By running the app in production mode or upgrading Expo (to incorporate the fix that skips intercepting text/event-stream responses), you should find that the SSE connection establishes successfully. Once you confirm that, you can proceed with full integration of the SSE-based timer, confident that it wasn’t your implementation at fault but rather the development tooling. Keep us updated on whether switching off Expo debug mode allows the SSE stream to come through – that will validate this diagnosis. Good luck, and happy streaming! 🚀