<script>
  // Shows an exercise's GIF. Saved exercises use the file stored in the database
  // (works offline), others load it from the server.
  let { exercise, size = 56 } = $props()

  let src = $state('')

  // $effect runs whenever the values it uses change. The function it returns is
  // "cleanup": it runs before the next run and when the component disappears.
  $effect(() => {
    if (exercise.gifBlob) {
      const url = URL.createObjectURL(exercise.gifBlob) // a temporary URL pointing at the file
      src = url
      return () => URL.revokeObjectURL(url) // free the memory when we're done with it
    }
    src = exercise.gif
  })
</script>

<img {src} alt={exercise.name} width={size} height={size} loading="lazy" />

<style>
  img {
    flex-shrink: 0;
    border-radius: 10px;
    background: #fff; /* the GIFs have a white background */
    object-fit: contain;
  }
</style>
