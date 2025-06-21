Resolving the Live Match “Double Screen” Flicker Issue
Understanding the Root Cause
Originally, the app used one single screen component (MatchScoringScreenSSE) to handle both scheduled and live match views. The UI content would toggle based on the match status or a state flag (showLiveView). When a match transitioned from scheduled to live (or when opening a live match), the component initially rendered the “scheduled” layout (e.g. "Ready to Kick Off?" screen) and then switched to the live layout once the state updated
GitHub
GitHub
. This implementation caused a visible flicker or “double screen” effect – it looked like the scheduled screen flashes for a moment before the live screen appears. The investigation confirms this behavior: on navigating to a LIVE match, the app briefly shows the scheduled match UI before updating to the live match UI. This isn’t actually a double navigation, but rather one screen re-rendering its content. Nonetheless, it feels like two screens loading back-to-back, which is confusing and frustrating for users.
Why the Issue Persists After Splitting Screens
You took the right approach by introducing separate routes/screens for scheduled and live matches (e.g. a dedicated LiveMatch screen vs ScheduledMatch screen). This is indeed a recommended solution to avoid the conditional UI flicker
GitHub
. In theory, navigating to a LiveMatch route should immediately show the live match component, bypassing any scheduled-match UI. However, the flicker issue is still happening because of how the live screen component initializes. The MatchScoringScreenSSE component (now used for the LiveMatch route) still contains logic that can render the scheduled-state UI if it doesn’t yet know the match is live. In the code, the decision to show live vs scheduled view is controlled by a computed flag shouldShowLiveView. Crucially, shouldShowLiveView gives first priority to a route param (routeIsLive) to decide if the live UI should be shown immediately
GitHub
. If that route parameter is missing or false, the component falls back to checking the loaded match data and timer status – which might not be instant. In that case, on initial mount the component doesn’t realize the match is live yet, and thus renders the “scheduled” layout by default until the data/timer updates. This is likely why you still see the “Scheduled” screen for a moment. In other words, the live screen isn’t being told upfront that the match is live, so it momentarily shows the default (scheduled) UI.
Solution: Ensure Immediate Live View on Navigation
To fix the flicker, we need to guarantee that the LiveMatch screen knows from the start that it should display the live match UI. Here are the steps to achieve this:
Pass the Live indicator in Navigation: When navigating to the live match screen, include a param that explicitly flags the match as live. For example, update your handleMatchPress logic to pass the match status or a boolean flag:
tsx
Copy
if (match.status === 'LIVE' || match.status === 'HALFTIME') {
    navigation.navigate('LiveMatch', { 
        matchId: match.id, 
        matchStatus: match.status, 
        isLive: true 
    });
} else {
    navigation.navigate('ScheduledMatch', { matchId: match.id });
}
This ensures route.params.isLive will be true on the LiveMatch screen. In the MatchScoringScreenSSE component, the shouldShowLiveView useMemo will see routeIsLive === true and immediately return true (meaning render the live UI)
GitHub
. By providing this param, we bypass the need to wait for any API or timer update to confirm the match status – the UI will treat it as live from the get-go.
Verify the Live screen logic: The MatchScoringScreenSSE already logs the route params on mount (console.log('🚀 INSTANT: Screen opened with params:', {...}) around line 83). After your change, you should see in the logs that routeIsLive is true for live matches. The internal logic will then mark shouldShowLiveView as true immediately, so the scheduled UI branch should not execute at all.
Loading state vs. Flicker: The component is designed to show a loading indicator until data is ready, which helps avoid showing the wrong UI. Specifically, it won’t render the main UI until isDataReady is true, instead showing a message like “Preparing live view...” with a spinner
GitHub
. With the isLive param in place, the code’s data readiness check treats live matches differently – it waits for either the timer or match data to confirm live status
GitHub
. In practice, this means when you tap a live match, you might see a loading spinner for a moment (if data is loading) but you should no longer see the "Ready to Kick Off" card at all. The loading state is a better UX than a misleading scheduled screen.
Differentiate or Remove Scheduled UI in Live Component: Since you now have a separate ScheduledMatch screen, you can further simplify the live match component to prevent any chance of the scheduled UI showing:
One option is to conditionally render nothing for the scheduled part when the route is the live screen. (For example, if you had to keep a single component for both, you could use the route name or the passed status to skip rendering the "Ready to Kick Off" section.)
An even cleaner approach is to remove the scheduled-match UI code from MatchScoringScreenSSE entirely, and possibly move it into a new ScheduledMatchScreen component. This seems to be what you attempted by adding a ScheduledMatch route. Make sure the LiveMatch route’s component does not contain the <Ready to Kick Off?> layout at all now. By isolating the live view, even if there’s a slight delay, the user will never accidentally see the scheduled match prompt on the live screen.
Test the flow: After implementing the above, run the app and tap on a live or halftime match:
It should navigate directly to the LiveMatch screen/component.
If the match data loads quickly, the live match details and timer appear almost instantly.
If there’s a slight delay (data fetch or SSE connection), you’ll see a “Loading match...” or “Preparing live view...” spinner instead of any scheduled-match UI. Then the live content will appear.
At no point should the “Ready to Kick Off?” scheduled screen flash – since we never render that for an already-live match now.
By following these steps, the navigation will feel seamless and eliminate the perceived double screen effect. The key is that the LiveMatch screen must be given enough context to render the correct UI from the start, which our navigation param and component separation achieve. This approach aligns with best practices for React Navigation and state handling, and it’s supported by the project’s own analysis that separating views or pre-loading state is the solution to the flicker
GitHub
.
Conclusion
In summary, the double-screen flicker was caused by reusing one component for two states. You’ve taken the right step to split the screens. The final piece is to pass an explicit “live” flag when navigating to the live match screen and ensure the live screen doesn’t default to any scheduled-match UI. Once implemented, users will no longer see a scheduled match screen flash; instead they go straight into the live match experience (with at most a brief loader). This will make the transition into live matches feel instantaneous and fix the frustration you’ve been experiencing.