const database = require('../config/database');

class TicketService {
  constructor() {
    this.tickets = [];
    this.ticketIdCounter = 1;
  }

  async createTicket(requestData) {
    try {
      const ticket = {
        id: this.generateTicketId(),
        description: requestData.description,
        location: requestData.location,
        category: requestData.category,
        userEmail: requestData.userEmail,
        status: 'open',
        priority: this.determinePriority(requestData.category)
      };

      const query = `
        INSERT INTO feedback (id, description, location, category, user_email, status, priority, manual_review, duplicate_of)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        ticket.id,
        ticket.description,
        ticket.location,
        ticket.category,
        ticket.userEmail,
        ticket.status,
        ticket.priority,
        false,
        null
      ];

      const result = await database.query(query, values);
      const savedTicket = result.rows[0];
      
      console.log(`[Ticket Service] Created new maintenance ticket: ${savedTicket.id}`);
      console.log(`[Ticket Service] Location: ${savedTicket.location}`);
      console.log(`[Ticket Service] Category: ${savedTicket.category}`);
      console.log(`[Ticket Service] Priority: ${savedTicket.priority}`);
      console.log(`[Ticket Service] Description: ${savedTicket.description}`);
      
      return {
        success: true,
        ticket: savedTicket
      };
    } catch (error) {
      console.error('[Ticket Service] Error creating ticket:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async flagForManualReview(requestData, reason) {
    try {
      const reviewItem = {
        id: this.generateReviewId(),
        description: requestData.description,
        location: requestData.location,
        category: requestData.category,
        userEmail: requestData.userEmail,
        status: 'pending_review'
      };

      const query = `
        INSERT INTO feedback (id, description, location, category, user_email, status, priority, manual_review, duplicate_of)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        reviewItem.id,
        reviewItem.description,
        reviewItem.location,
        reviewItem.category,
        reviewItem.userEmail,
        reviewItem.status,
        this.determinePriority(requestData.category),
        true,
        null
      ];

      const result = await database.query(query, values);
      const savedReviewItem = result.rows[0];

      console.log(`[Ticket Service] Flagged for manual review: ${savedReviewItem.id}`);
      console.log(`[Ticket Service] Reason: ${reason}`);
      console.log(`[Ticket Service] Location: ${savedReviewItem.location}`);
      console.log(`[Ticket Service] Description: ${savedReviewItem.description}`);
      
      return {
        success: true,
        reviewItem: savedReviewItem
      };
    } catch (error) {
      console.error('[Ticket Service] Error flagging for review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async markAsDuplicate(requestData, duplicateTickets) {
    try {
      const originalTicketId = duplicateTickets.length > 0 ? duplicateTickets[0].id : null;
      const duplicateRecord = {
        id: this.generateDuplicateId(),
        description: requestData.description,
        location: requestData.location,
        category: requestData.category,
        userEmail: requestData.userEmail,
        status: 'duplicate'
      };

      const query = `
        INSERT INTO feedback (id, description, location, category, user_email, status, priority, manual_review, duplicate_of)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        duplicateRecord.id,
        duplicateRecord.description,
        duplicateRecord.location,
        duplicateRecord.category,
        duplicateRecord.userEmail,
        duplicateRecord.status,
        this.determinePriority(requestData.category),
        false,
        originalTicketId
      ];

      const result = await database.query(query, values);
      const savedDuplicateRecord = result.rows[0];

      console.log(`[Ticket Service] Marked as duplicate: ${savedDuplicateRecord.id}`);
      console.log(`[Ticket Service] Original ticket: ${savedDuplicateRecord.duplicate_of}`);
      console.log(`[Ticket Service] Location: ${savedDuplicateRecord.location}`);
      
      return {
        success: true,
        duplicateRecord: savedDuplicateRecord,
        originalTickets: duplicateTickets
      };
    } catch (error) {
      console.error('[Ticket Service] Error marking as duplicate:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getTicketsByLocation(location) {
    try {
      const query = 'SELECT * FROM feedback WHERE location = $1 AND status != $2';
      const result = await database.query(query, [location, 'closed']);
      return result.rows;
    } catch (error) {
      console.error('[Ticket Service] Error getting tickets by location:', error);
      return [];
    }
  }

  async getAllTickets() {
    try {
      const query = 'SELECT * FROM feedback ORDER BY created_at DESC';
      const result = await database.query(query);
      return result.rows;
    } catch (error) {
      console.error('[Ticket Service] Error getting all tickets:', error);
      return [];
    }
  }

  async getTicketById(id) {
    try {
      const query = 'SELECT * FROM feedback WHERE id = $1';
      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[Ticket Service] Error getting ticket by ID:', error);
      return null;
    }
  }

  async updateTicketStatus(id, status) {
    try {
      const query = `
        UPDATE feedback 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING *
      `;
      const result = await database.query(query, [status, id]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Ticket not found' };
      }
      
      const ticket = result.rows[0];
      console.log(`[Ticket Service] Updated ticket ${id} status to: ${status}`);
      return { success: true, ticket };
    } catch (error) {
      console.error('[Ticket Service] Error updating ticket status:', error);
      return { success: false, error: error.message };
    }
  }

  generateTicketId() {
    return `TICKET-${String(this.ticketIdCounter++).padStart(6, '0')}`;
  }

  generateReviewId() {
    return `REVIEW-${Date.now()}`;
  }

  generateDuplicateId() {
    return `DUPLICATE-${Date.now()}`;
  }

  determinePriority(category) {
    const highPriorityCategories = [
      'ELECTRICAL REPAIR',
      'FIRE ALARMS/EXTINGUISHERS',
      'EMERGENCY/EXIT LIGHTING',
      'EYE WASH AND SAFETY SHOWER REPAIRS',
      'PLUMBING REPAIR',
      'HEATING/COOLING'
    ];

    const mediumPriorityCategories = [
      'DOOR REPAIRS',
      'WINDOW REPAIRS',
      'AIR FLOW ISSUES',
      'DRINKING WATER FOUNTAIN'
    ];

    if (highPriorityCategories.includes(category)) {
      return 'high';
    } else if (mediumPriorityCategories.includes(category)) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

module.exports = TicketService;