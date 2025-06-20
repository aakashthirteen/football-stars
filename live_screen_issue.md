Improving the Live Match Screen Transitions
Immediate Navigation for Live Matches
If a match is already in progress, the app should navigate directly to the live view instead of showing any pre-kickoff screen. In other words, users should never see a "Ready to Kick Off" message for a match that has started – the UI should jump straight into the live match interface
GitHub
. This means skipping the scheduled state entirely when opening an ongoing match. Ensuring immediate navigation to the live screen will eliminate the jarring effect of a brief scheduled screen flash for live matches.
Current Approach: Conditional Rendering Causes Flicker
Right now, the app uses one combined screen (MatchScoringScreenSSE.tsx) to handle both scheduled and live match states. The component renders conditionally based on a state flag (e.g. shouldShowLiveView). For example, the render logic looks roughly like:
tsx
Copy
{ shouldShowLiveView ? (
    // Live match UI
) : (
    // "Ready to Kick Off" UI
) }
This means when you navigate to a match, it first loads the scheduled match layout by default, then once the app detects the match is live, it swaps in the live UI. No separate navigation (e.g. navigation.navigate('LiveMatch')) is performed – it’s all in one screen
GitHub
. As a result, users experience a flicker/double screen effect: the scheduled screen appears momentarily and then is replaced by the live screen. The log and code confirm that the UI toggles state after initial render when the conditions update, which is why it looks like two screens flash back-to-back
GitHub
. This approach is the core issue leading to the unsmooth transition.
Other Factors Exacerbating the Flicker
Several asynchronous behaviors in the current implementation make the flicker worse:
Loading spinners and timeouts: There may be a loading spinner or a “safety timeout” (~3 seconds) while the app determines the match state and awaits data. This delay can cause the scheduled UI to linger on screen longer than necessary.
SSE connection fallback: The timer uses Server-Sent Events; if the SSE connection doesn’t establish immediately, the code might wait a few seconds before falling back or updating the state. For example, if SSE doesn’t connect within 3 seconds, the app might force-update the timer or show a fallback, during which time the scheduled view stays visible.
Multiple useEffect triggers: The match screen likely has multiple hooks (for loading match data, starting the timer, subscribing to SSE, etc.) that update state in sequence. These can trigger re-renders at different times (e.g. one effect sets showLiveView true, another stops a loading indicator), causing visible UI transitions.
Route params vs. live data mismatch: The navigation is passing props like matchStatus or isLive to the screen, but the actual live state might rely on backend confirmation or SSE events. If the screen’s initial state doesn’t perfectly align with the real match status (for example, the param says live but some internal timerState still says scheduled until SSE kicks in), the UI might flip states after a brief delay. Conflicting sources of truth (navigation route vs. timer hook) can momentarily show the wrong screen.
In summary, the combination of these factors means the app doesn’t seamlessly load directly into the correct state. Instead, it renders the scheduled view then updates to live, which feels glitchy. Each asynchronous step (data fetch, SSE connect, timeouts) can prolong the transitional flicker.
Recommended Solution: Split into Separate Screens
The most robust fix is to refactor into two distinct screens for the two states, rather than one conditional screen
GitHub
. This would dramatically improve the UX by removing the conditional UI swap. Key changes to implement:
Create separate screen components: e.g. ScheduledMatchScreen.tsx for matches that haven’t started, and LiveMatchScreen.tsx for ongoing (live or halftime) matches. Each screen will handle only its respective UI and logic.
Update navigation routes: In your navigation stack, add separate routes for the scheduled and live match screens. For example:
tsx
Copy
<Stack.Screen name="ScheduledMatch" component={ScheduledMatchScreen} />
<Stack.Screen name="LiveMatch" component={LiveMatchScreen} />
Remove or deprecate using the combined MatchScoring route for these states.
Navigate explicitly based on match status: Wherever the app opens a match (for example, in the matches list or after creating a match), decide the destination screen by the match’s status.
If a match is 'LIVE' or 'HALFTIME', use navigation.navigate('LiveMatch', { matchId: ... }).
If a match is 'SCHEDULED' (not started yet), use navigation.navigate('ScheduledMatch', { matchId: ... }).
For instance, in the matches list press handler, replace the single MatchScoring navigation with logic that directs to the correct screen. This ensures users go straight into the appropriate UI without a state toggle
GitHub
.
Eliminate conditional rendering for state: Each new screen should have a single responsibility. The live match screen can assume the match is in progress and set up the timer/SSE accordingly, without any “Ready to Kick Off” UI at all. Conversely, the scheduled screen shows pre-match info or a “Start Match” button, and doesn’t mount any live timer logic. By removing the {showLiveView ? ... : ...} split in one component, the flicker will disappear, because the app isn’t trying to swap UIs in-place mid-stream.
Simplify state management: With separate screens, you can also simplify or remove the hacks that were in place to mitigate timing issues. For example, you likely won’t need the artificial 3-second delay to decide which view to show – the navigation decision is made upfront. The live screen can still show a loading indicator if needed while connecting SSE, but the user won’t see an unrelated screen first. Also, the isNewMatch flag logic (that attempted to immediately show live view) can be removed or moved into the navigation layer (i.e. just navigate to live screen on match start). Overall, each screen’s useEffect logic will be more straightforward, reducing conflicting updates.
By implementing these changes, the double-screen flicker should be fully resolved. Users opening a live match will see the live scoring screen immediately (no flash of the kickoff screen), and starting a match will feel like a single transition to the live interface. In short, explicit navigation and screen separation will provide a smooth UX, as there’s no conditional content swap happening mid-render
GitHub
. This aligns with best practices for React Navigation (each screen for one purpose) and will make the app feel much more polished.