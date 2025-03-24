import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons"; // Importuj ikonu X

import {
  faHeart,
  faThumbsUp,
  faLaugh,
  faSadTear,
  faAngry,
  faGrinStars, // za WOW
} from "@fortawesome/free-solid-svg-icons";

interface Reaction {
  username: string;
  type: string;
}

interface ReactionPopupProps {
  reactions: Reaction[];
  onClose: () => void;
}

const ReactionPopup: React.FC<ReactionPopupProps> = ({
  reactions,
  onClose,
}) => {
  const [filter, setFilter] = useState("ALL");

  // Grupisanje reakcija po vrsti
  const groupedReactions = reactions.reduce((acc, reaction) => {
    acc[reaction.type] = acc[reaction.type] || [];
    acc[reaction.type].push(reaction.username);
    return acc;
  }, {} as { [key: string]: string[] });

  // Pravi listu filtera prema vrstama reakcija koje imamo u podacima
  const availableReactions = Object.keys(groupedReactions);

  // Filtriranje reakcija prema izabranom tipu
  const filteredReactions =
    filter === "ALL"
      ? groupedReactions
      : { [filter]: groupedReactions[filter] };

  // Funkcija za prikazivanje ikona reakcija
  const renderReactionIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return <FontAwesomeIcon icon={faThumbsUp} />;
      case "LOVE":
        return <FontAwesomeIcon icon={faHeart} />;
      case "LAUGH":
        return <FontAwesomeIcon icon={faLaugh} />;
      case "SAD":
        return <FontAwesomeIcon icon={faSadTear} />;
      case "ANGRY":
        return <FontAwesomeIcon icon={faAngry} />;
      case "WOW":
        return <FontAwesomeIcon icon={faGrinStars} />;
      default:
        return null;
    }
  };

  // Funkcija za rukovanje promenom filtera
  const handleFilterChange = (filterType: string) => {
    setFilter(filterType);
  };

  return (
    <div className="reaction-popup">
      <div className="reaction-popup-header">
        {/* Kreiraj dugmadi za filter samo za dostupne reakcije */}
        <button onClick={() => handleFilterChange("ALL")}>All</button>
        {availableReactions.map((reactionType) => (
          <button
            key={reactionType}
            onClick={() => handleFilterChange(reactionType)}
          >
            {renderReactionIcon(reactionType)} {reactionType}
          </button>
        ))}
        <button onClick={onClose}>
          {" "}
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="reaction-groups">
        {/* Provera da li filteredReactions nije undefined i da sadrži reakcije */}
        {Object.entries(filteredReactions).length > 0 ? (
          Object.entries(filteredReactions).map(([type, users]) => (
            <div key={type} className="reaction-group">
              <div className="reaction-type">
                {renderReactionIcon(type)}
                <span>{type}</span>
                <span>({users.length})</span> {/* Broj korisnika */}
              </div>
              <div className="reaction-users">
                {/* Provera da li korisnici postoje */}
                {users && users.length > 0 ? (
                  users.map((username, idx) => (
                    <span key={idx} className="reaction-user">
                      {username}
                    </span>
                  ))
                ) : (
                  <span>No users</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div>No reactions available</div> // Ako nema reakcija za selektovani filter
        )}
      </div>
    </div>
  );
};

export default ReactionPopup;
