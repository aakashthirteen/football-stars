Navigation Flicker Issue in Live Matches and Timer Stoppage Logic
Navigation Library & Structure
React Navigation Setup: The app uses React Navigation v6 with a stack navigator (and likely bottom tabs) for match screens
GitHub
. For example, the MatchesStack defines routes including the matches list, match creation, and the match scoring screen (live match view) using @react-navigation/stack
GitHub
GitHub
. This means navigation is handled by stacking screens on top of each other.
Single Screen for Live vs Scheduled: Both the scheduled match view (pre-kickoff "Ready to Kick Off" state) and the live match view are implemented in the same React component: MatchScoringScreenSSE.tsx. The UI is toggled based on a state variable (e.g. showLiveView) that checks the match status and timer state. In the code, the render logic looks roughly like:
tsx
Copy
{showLiveView ? (
    // Live match UI
) : (
    // "Ready to Kick Off" UI
)}
This conditional render is evident in the source code
GitHub
. Initially, when you navigate to a match, showLiveView may be false, so the scheduled match layout renders. Once the match status or timer updates to indicate the match is live, the state flips and the live UI is shown.
Cause of Flicker: Because the app uses one screen that re-renders its content on state change, users experience a flicker or double navigation effect. For example, when starting a match, there's a brief delay where the scheduled match screen appears (since the match was just created or opened in "scheduled" state), and then after a moment the live match UI replaces it. Similarly, opening an ongoing live match from the "Live Matches" list may first show the default scheduled view before the state updates to live. This happens because MatchScoringScreenSSE updates showLiveView after receiving the timer/match status change (via an effect). The log in the code confirms that it toggles the view state when the conditions meet, which implies an update after initial render
GitHub
. In practical terms, the navigation transition isn't seamless – it feels like two screens loading back-to-back (scheduled then live), which is indeed a poor user experience.
Acceptability and Potential Fixes: This flickering is not an acceptable UX for live match navigation. It can confuse users and makes the app feel laggy. Ideally, the app should directly show the live match screen when appropriate. To fix this, we could consider separating the views or improving the logic:
Separate Screens: Use distinct screens/routes for "Match Setup" (scheduled state) and "Live Match" so that navigation is explicit and there is no conditional UI swap. For instance, if a match is already in progress, navigate straight to a dedicated LiveMatch screen component.
Pre-load State: Alternatively, determine the match status before navigating. For a match that is started, set a navigation parameter or state so that the component knows to show live view immediately on mount. (In fact, the code already attempts something like this with an isNewMatch flag and by setting matchStartRequested state to true when starting a match to force the live view immediately
GitHub
, but if data loading or SSE connection lags, the issue can still occur.)
In summary, the navigation is currently implemented in a way that causes a visible flicker between scheduled and live states. Refactoring to separate these states or to more seamlessly initialize the correct view will provide a smoother experience.
Timer & Stoppage Time Logic
Stoppage Time Support: The system fully supports stoppage time (added time) for both halves of a match. In the database and data models, there are fields like added_time_first_half and added_time_second_half to track extra minutes beyond the 45 and 90-minute marks
GitHub
. This means the backend is aware of how much extra time (if any) the referee has added in each half.
Automatic Halftime and Fulltime Triggers: The match timer is designed to automatically pause at halftime and stop at fulltime once the scheduled time plus any added time is reached. Specifically, when the first half reaches 45 minutes plus the added first-half stoppage minutes, the system will trigger halftime; similarly, at 90 minutes plus second-half added time, it triggers full time. According to the project’s documentation, this behavior is a confirmed feature: “Automatic Halftime: Matches auto-pause at 45'+ stoppage time... Automatic Fulltime: Matches auto-end at 90'+ stoppage time”
GitHub
. The implementation is considered exact and reliable – the status changes at the precise moment the half or match should end
GitHub
. There is no need to manually stop the timer at these intervals; the timer service on the server handles it.
How It Works in Practice: When the timer hits the end of a half, the match status is updated to "HALFTIME" and the timer state isHalftime becomes true (and isPaused true as well). This is reflected in the front-end timer hook state, causing the UI to indicate halftime. Typically, a modal or indicator is shown at this point – for example, a halftime modal pops up displaying the score and a "Start Second Half" button, as described in the codebase
GitHub
. For full time, once 90' plus stoppage is reached, the match status becomes "COMPLETED" (full time), and the timer stops incrementing. The app then can automatically navigate to the post-match screen (such as the player ratings screen) as part of the fulltime handling
GitHub
. In the MatchScoringScreenSSE logic, we indeed see that on ending a match it calls navigation.replace('PlayerRating', {...}) after a brief delay, which corresponds to that automatic navigation after full time
GitHub
.
No Manual Intervention Needed: Because of this setup, you do not need to manually pause or stop the clock at 45' or 90'. The front-end and back-end are coordinated to do it automatically. In fact, the code includes a note that halftime is now fully automated by the professional timer service, with no manual button presses
GitHub
. The timer hook (useMatchTimer) listens to server-sent events or polling updates; when a halftime or fulltime event comes (changing the status), the hook updates the state to reflect that the timer is paused or ended. The transition happens immediately when time runs out. (There currently isn't a built-in advance warning like "1 minute remaining" — the design assumes a direct whistle at the exact stoppage time cutoff, as in real football.)
Conclusion: The timer will automatically stop at halftime and fulltime (including stoppage time) by design. If you are not observing this behavior, it could indicate a bug in the timer service or communication. However, the documented functionality and the latest code confirm that:
At 45 + added minutes, the match goes into halftime (timer pauses and halftime modal is shown)
GitHub
.
At 90 + added minutes, the match ends (timer stops and the app proceeds to fulltime sequence, e.g., showing final whistle and navigating to summary)
GitHub
.
This aligns with real-world match flow and ensures timing is handled consistently without requiring manual input. If needed, the system could be enhanced to give a subtle alert shortly before these automatic stops (e.g., a notification at 44' or 89'), but as of now the behavior is to stop exactly on time with no prior warning, simulating a referee’s whistle precisely at the end of allotted time.