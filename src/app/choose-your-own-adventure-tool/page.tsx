export default function ChooseYourOwnAdventureToolPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-[var(--background)]">
      <p className="max-w-3xl text-center font-serif text-lg text-[var(--text-borders)]">
        {"I'm working on an IWE (integrated writing environment) for writing choose your own adventure stories. On one side will be a graph representation of the story that will be mutable so you can adjust connections between nodes. On the other side will be the actual text of the story as it would appear on paper. If you make edits to the graph, it will update the paper-representation, and if you select nodes it will scroll to their content in the text window. There will be an export option I think for finished products. I don't really want to pay for the storage required to add a saved project feature for users and associated accounts, so I'm ideating on that these days."}
      </p>
    </div>
  );
}

