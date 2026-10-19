# Exercises

My weekly exercise programme. Pick a week, then tap an exercise to watch its demo video.

Live site: https://amandavarella.github.io/exercises/

Each week has its own address, for example https://amandavarella.github.io/exercises/week-17/

## Adding a week

1. Add a new block to the `WEEKS` list in `weeks.js` with the week number and its exercises.
2. Run `node tools/sync-weeks.js`. It creates the `week-<number>/` folder for the new week.
3. Commit both changes.

The home page shows the highest week number as "This week". A GitHub check (`Check week pages`) fails if any week is missing its folder.

## Files

- `index.html`: home page listing all weeks
- `weeks.js`: the weeks and their exercises
- `week.css`, `week.js`: shared look and behaviour of every week page
- `tools/week-page.html`: template for each `week-<number>/index.html` (edit this, then run the sync script)
- `week.html`: redirects old `week.html?w=17` links to `/week-17/`
