const computeAchievements = (user) => {
  const badges = [];
  const stats = user.stats || {};
  const moviesWatched = stats.moviesWatched || user.watched?.length || 0;
  const reviewsCount = stats.reviewsCount || user.reviews?.length || 0;
  const followersCount = stats.followersCount || user.followers?.length || 0;
  const likesCount = stats.likesCount || 0;

  // Watched movies achievements
  if (moviesWatched >= 1) badges.push("Premier Film");
  if (moviesWatched >= 10) badges.push("10 Films Vus");
  if (moviesWatched >= 25) badges.push("Cinéphile");
  if (moviesWatched >= 50) badges.push("50 Films Vus");
  if (moviesWatched >= 100) badges.push("Critique Expert");
  if (moviesWatched >= 250) badges.push("Maître Cinéphile");

  // Review achievements
  if (reviewsCount >= 1) badges.push("Première Critique");
  if (reviewsCount >= 5) badges.push("Critique Actif");
  if (reviewsCount >= 25) badges.push("Critique de Renom");
  if (reviewsCount >= 50) badges.push("Critique Légendaire");

  // Social achievements
  if (followersCount >= 1) badges.push("Première Personne");
  if (followersCount >= 5) badges.push("5 Abonnés");
  if (followersCount >= 10) badges.push("Influenceur");
  if (followersCount >= 50) badges.push("Personnalité");
  if (followersCount >= 100) badges.push("Célébrité");

  // Likes achievements
  if (likesCount >= 5) badges.push("Apprécié");
  if (likesCount >= 25) badges.push("Très Apprécié");
  if (likesCount >= 100) badges.push("Adoré");

  // Genre specialized achievements
  const genreStats = stats.genreStats || [];
  const hasHorrorFan = genreStats.some(g => g.genreId === 27 && g.count >= 5);
  const hasActionFan = genreStats.some(g => g.genreId === 28 && g.count >= 10);
  const hasComedyFan = genreStats.some(g => g.genreId === 35 && g.count >= 8);
  
  if (hasHorrorFan) badges.push("Fan d'Horreur");
  if (hasActionFan) badges.push("Addict d'Action");
  if (hasComedyFan) badges.push("Amoureux de Comédie");

  // Streak achievements
  if (user.watchStreak >= 7) badges.push("Semaine d'Or");
  if (user.watchStreak >= 30) badges.push("Mois Incroyable");
  if (user.watchStreak >= 365) badges.push("Champion de l'Année");

  // Level up
  const xpNeeded = 100 * user.level;
  if (user.xp >= xpNeeded) {
    badges.push(`Niveau ${user.level + 1}`);
  }

  // Remove duplicates
  return [...new Set(badges)];
};

const updateUserStats = async (user, movieData) => {
  // This function updates user stats based on watched movie
  if (!user.stats) {
    user.stats = {
      moviesWatched: 0,
      totalWatchTime: 0,
      reviewsCount: 0,
      likesCount: 0,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      genreStats: [],
      providerStats: []
    };
  }

  // Update watched movie count
  user.stats.moviesWatched = user.watched?.length || 0;
  user.stats.followersCount = user.followers?.length || 0;
  user.stats.followingCount = user.following?.length || 0;

  // Update genre stats if movie data is provided
  if (movieData && movieData.genres && movieData.rating !== undefined) {
    movieData.genres.forEach(genre => {
      const existingGenre = user.stats.genreStats.find(g => g.genreId === genre.id);
      if (existingGenre) {
        existingGenre.count += 1;
        // Update average rating
        existingGenre.avgRating =
          (existingGenre.avgRating * (existingGenre.count - 1) + movieData.rating) /
          existingGenre.count;
      } else {
        user.stats.genreStats.push({
          genreId: genre.id,
          genreName: genre.name,
          count: 1,
          avgRating: movieData.rating
        });
      }
    });
  }

  // Update XP and level
  user.xp += 10; // XP per action
  user.level = Math.floor(user.xp / 100) + 1;

  // Recompute achievements
  user.achievements = computeAchievements(user);

  return user;
};

module.exports = { computeAchievements, updateUserStats };

