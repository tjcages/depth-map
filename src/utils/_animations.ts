export const pageTransition = () => {
  document.documentElement.animate(
    [
      {
        opacity: 1
      },
      {
        opacity: 0
      }
    ],
    {
      duration: 300,
      easing: "ease-in-out",
      fill: "forwards",
      pseudoElement: "::view-transition-old(root)"
    }
  );

  document.documentElement.animate(
    [
      {
        opacity: 0
      },
      {
        opacity: 1
      }
    ],
    {
      duration: 300,
      easing: "ease-in-out",
      fill: "forwards",
      pseudoElement: "::view-transition-new(root)"
    }
  );
};
