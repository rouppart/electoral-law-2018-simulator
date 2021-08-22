<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer base {
    body {
      position: initial;
      width: initial;
      height: initial;
      @apply p-0;
    }

    button {
      @apply bg-gray-200 hover:bg-gray-400 px-2 py-1.5;
    }

    input {
      @apply border rounded px-1 py-0.5;
    }

    a {
      @apply hover:underline text-blue-800;
    }

    ul {
      @apply list-disc list-inside;
    }
  }

  @layer components {
    th, td {
      @apply p-1;
    }

    .deletebutton {
      @apply font-bold py-0.5;
    }

    .errortext {
      @apply text-red-500;
    }

    .errorborder {
      @apply border-2 border-red-400;
    }
  }
</style>