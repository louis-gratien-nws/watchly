const { computeAchievements } = require("./achievements");

const ACHIEVEMENTS = {
  FIRST_MOVIE: "Premier Film",
  TEN_MOVIES: "10 Films Vus",
  CINEPHILE: "Cinéphile",
  FIFTY_MOVIES: "50 Films Vus",
  EXPERT: "Critique Expert",
  MASTER: "Maître Cinéphile",
  FIRST_REVIEW: "Première Critique",
  ACTIVE_REVIEWER: "Critique Actif",
  FAMOUS_CRITIC: "Critique de Renom",
  LEGENDARY_CRITIC: "Critique Légendaire",
  FIRST_FOLLOWER: "Première Personne",
  FIVE_FOLLOWERS: "5 Abonnés",
  INFLUENCER: "Influenceur",
  PERSONALITY: "Personnalité",
  CELEBRITY: "Célébrité",
  APPRECIATED: "Apprécié",
  VERY_APPRECIATED: "Très Apprécié",
  LOVED: "Adoré",
  HORROR_FAN: "Fan d'Horreur",
  ACTION_ADDICT: "Addict d'Action",
  COMEDY_LOVER: "Amoureux de Comédie",
  WEEK_GOLD: "Semaine d'Or",
  MONTH_AMAZING: "Mois Incroyable",
  YEAR_CHAMPION: "Champion de l'Année"
};

const calculateAchievements = (user) => {
  return computeAchievements(user);
};

module.exports = { ACHIEVEMENTS, calculateAchievements };
