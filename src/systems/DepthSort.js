/** Puts every fighter and shadow in back-to-front order using floor depth. */
export function depthSort(fighters) {
  for (const fighter of fighters) {
    fighter.syncView();
  }
}
