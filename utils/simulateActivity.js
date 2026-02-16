// utils/simulateActivity.js

/**
 * Simule l'activité en ajoutant des valeurs aléatoires AUX STATS DE BASE
 * Pas de modification en DB, juste visuel
 */
export function simulateActivity(opportunity) {
  const now = Date.now();
  const seed = opportunity.id + Math.floor(now / 60000); // Change chaque minute
  
  // Générateur pseudo-aléatoire basé sur seed
  const random = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Investisseurs bonus (0-50 selon popularité)
  const bonusInvestors = Math.floor(
    random(seed) * (opportunity.featured ? 50 : 20)
  );

  // Montant bonus (0-5M selon popularité)
  const bonusAmount = Math.floor(
    random(seed + 1) * (opportunity.featured ? 5000000 : 2000000)
  );

  return {
    ...opportunity,
    totalInvestors: opportunity.totalInvestors + bonusInvestors,
    totalInvested: opportunity.totalInvested + bonusAmount,
    // Flag pour savoir que c'est simulé
    _simulated: true
  };
}

/**
 * Applique la simulation à une liste d'opportunités
 */
export function simulateAllActivity(opportunities) {
  return opportunities.map(simulateActivity);
}