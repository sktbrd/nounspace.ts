import React, { useReducer, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { MarkdownRenderers } from "@/common/lib/utils/markdownRenderers";
import voteOnProposal, { ProposalType } from "../utils/voteOnProposal";
import {
  renderSingleChoiceVotingUI,
  renderApprovalVotingUI,
  renderRankedChoiceVotingUI,
  renderWeightedVotingUI,
} from "../utils/renderVotingUI";
import { initialState, reducer, State, Action } from "../utils/stateManagement";

interface ProposalItemProps {
  proposal: any;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  space: string;
}

const ProposalItem: React.FC<ProposalItemProps> = ({
  proposal,
  isExpanded,
  onToggleExpand,
  space,
}) => {
  const extractImageUrl = (markdown: string): string | null => {
    const imageRegex = /!\[.*?\]\((.*?)\)/;
    const match = imageRegex.exec(markdown);
    return match ? match[1] : null;
  };

  const [avatarUrl, setAvatarUrl] = useState<string>(
    extractImageUrl(proposal.body) || "/images/noggles.svg",
  );

  const handleError = () => {
    setAvatarUrl("/images/noggles.svg"); // Fallback placeholder image
  };

  const handleVote = (
    choiceId: number | number[] | { [key: string]: number },
    reason: string,
  ) => {
    const now = Date.now() / 1000;
    if (now < proposal.start || now > proposal.end) {
      alert("Voting is not open for this proposal.");
      return;
    }
    voteOnProposal(
      proposal.id,
      choiceId,
      reason,
      space,
      proposal.type as ProposalType,
    );
  };

  const [state, dispatch] = useReducer<React.Reducer<State, Action>>(
    reducer,
    initialState,
  );

  const renderVotingButtons = () => {
    switch (proposal.type) {
      case "single-choice":
        return renderSingleChoiceVotingUI(proposal, handleVote);
      case "approval":
        return renderApprovalVotingUI(proposal, state, dispatch, handleVote);
      case "quadratic":
        return renderWeightedVotingUI(proposal, state, dispatch, handleVote);
      case "ranked-choice":
        return renderRankedChoiceVotingUI(
          proposal,
          state,
          dispatch,
          handleVote,
        );
      case "weighted":
        return renderWeightedVotingUI(proposal, state, dispatch, handleVote);
      case "basic":
        return renderSingleChoiceVotingUI(proposal, handleVote);
      default:
        return renderSingleChoiceVotingUI(proposal, handleVote);
    }
  };

  const getStatus = () => {
    const now = Date.now() / 1000;
    if (now < proposal.start) return "Pending";
    if (now > proposal.end) {
      if (proposal.state === "closed") {
        if (proposal.type === "ranked-choice" || proposal.type === "weighted") {
          return "Closed";
        }
        const maxScore = Math.max(...proposal.scores);
        const isPassed = proposal.scores[0] === maxScore;
        return isPassed ? "Passed" : "Failed";
      }
      return proposal.state;
    }
    return "Active";
  };

  const status = getStatus();

  const getStatusBadgeColor = () => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500";
      case "Active":
        return "bg-green-500";
      case "Passed":
        return "bg-green-500";
      case "Failed":
        return "bg-red-500";
      case "Closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // const renderScores = () => {
  //   if (proposal.state !== "closed") return null;

  //   return (
  //     <div className="mt-4">
  //       <h5 className="font-bold mb-2">Results:</h5>
  //       {proposal.choices.map((choice: string, index: number) => (
  //         <div key={index} className="flex items-center mb-1">
  //           <div className="flex-grow">{choice}</div>
  //           <div>{proposal.scores[index]} votes</div>
  //         </div>
  //       ))}
  //     </div>
  //   );
  // };

  const renderVotingResults = () => {
    if (
      proposal.state !== "closed" ||
      proposal.type === "ranked-choice" ||
      proposal.type === "weighted"
    ) {
      return null;
    }

    const totalScores = proposal.scores.reduce((acc, score) => acc + score, 0);

    return (
      <div className="mt-4">
        {proposal.choices.map((choice: string, index: number) => {
          const score = proposal.scores[index];
          const percentage = (score / totalScores) * 100;

          return (
            <div key={index} className="flex items-center mb-2">
              <div className="flex-grow">
                <div className="text-xs font-medium">{choice}</div>
                <div className="h-2 w-full bg-gray-300 rounded">
                  <div
                    className="h-full bg-green-500 rounded"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <div className="ml-2 text-xs font-medium">
                {score.toFixed(2)} GNAR
              </div>
            </div>
          );
        })}
        <div className="mt-2">
          {proposal.scores[0] > proposal.scores[1] ? (
            <span className="text-green-500 font-bold">Passed</span>
          ) : (
            <span className="text-red-500 font-bold">Failed</span>
          )}
        </div>
      </div>
    );
  };

  const [visibleSection, setVisibleSection] = useState<string>("preview");

  const handleSectionChange = (section: string) => {
    setVisibleSection(section);
  };

  return (
    <div className="flex flex-row p-4 border border-gray-200 rounded-lg mb-1 relative">
      <span
        className={`absolute top-2 right-2 text-white py-1 px-2 rounded text-xs ${getStatusBadgeColor()}`}
        style={{ width: "60px", textAlign: "center" }}
      >
        {status}
      </span>
      <img
        src={avatarUrl}
        alt="Avatar"
        className="w-16 h-16 rounded-md mr-4"
        onError={handleError}
      />
      <div className="flex flex-col flex-grow">
        <h4
          className="font-bold cursor-pointer"
          onClick={() => onToggleExpand(proposal.id)}
        >
          {proposal.title}
        </h4>

        {isExpanded && (
          <>
            <div className="flex space-x-4 mt-2">
              <button
                className={`px-2 py-1 ${visibleSection === "preview" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => handleSectionChange("preview")}
              >
                Preview
              </button>
              <button
                className={`px-2 py-1 ${visibleSection === "results" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => handleSectionChange("results")}
              >
                Results
              </button>
              <button
                className={`px-2 py-1 ${visibleSection === "voting" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => handleSectionChange("voting")}
              >
                Voting
              </button>
            </div>

            {visibleSection === "preview" && (
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
                components={MarkdownRenderers}
              >
                {proposal.body}
              </ReactMarkdown>
            )}
            {visibleSection === "results" && renderVotingResults()}
            {visibleSection === "voting" && (
              <div className="mt-4">{renderVotingButtons()}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProposalItem;
