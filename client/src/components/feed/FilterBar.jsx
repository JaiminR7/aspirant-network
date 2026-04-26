import { useMemo } from "react";
import { Compass, Sparkles } from "lucide-react";

const FilterBar = ({
  userExam,
  selectedFeed,
  exams,
  onSelectForYou,
  onSelectExplore,
}) => {
  const forYouLabel = useMemo(() => {
    return `For You (${userExam || "Exam"})`;
  }, [userExam]);

  return (
    <div className="sticky top-14 lg:top-0 z-20 bg-background/90 backdrop-blur border-b border-border mb-5">
      <div className="py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onSelectForYou}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedFeed === "PERSONALIZED"
              ? "bg-primary/15 text-primary border border-primary/20"
              : "bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {forYouLabel}
        </button>

        <div
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${
            selectedFeed !== "PERSONALIZED"
              ? "border-primary/20 bg-primary/5"
              : "border-border bg-card"
          }`}
        >
          <Compass
            className={`h-4 w-4 ${
              selectedFeed !== "PERSONALIZED"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          />
          <label
            htmlFor="explore-exam"
            className={`text-sm ${
              selectedFeed !== "PERSONALIZED"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            Explore
          </label>
          <select
            id="explore-exam"
            value={selectedFeed === "PERSONALIZED" ? "ALL" : selectedFeed}
            onChange={(event) => onSelectExplore(event.target.value)}
            className="bg-transparent text-sm font-medium text-foreground outline-none"
          >
            <option value="ALL">All Exams</option>
            {exams.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
