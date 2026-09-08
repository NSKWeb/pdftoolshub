export const investorRelationsService = {
  async generateFinancialDashboard() {
    return {
      arr: 50000000,
      growth: 1.2,
      burnRate: 2000000,
      runwayMonths: 24,
      ebitda: -500000,
      lastAuditDate: new Date(),
    };
  },

  async getShareholderCommunication() {
    return [
      { id: 1, title: 'Q1 2024 Earnings Call', date: '2024-04-15' },
      { id: 2, title: 'Annual Meeting of Shareholders', date: '2024-06-01' },
    ];
  }
};
