class TicketService {
  constructor() {
    this.tickets = [];
    this.ticketIdCounter = 1;
  }

  createTicket(requestData) {
    try {
      const ticket = {
        id: this.generateTicketId(),
        description: requestData.description,
        location: requestData.location,
        category: requestData.category,
        userEmail: requestData.userEmail,
        status: 'open',
        priority: this.determinePriority(requestData.category),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.tickets.push(ticket);
      
      console.log(`[Ticket Service] Created new maintenance ticket: ${ticket.id}`);
      console.log(`[Ticket Service] Location: ${ticket.location}`);
      console.log(`[Ticket Service] Category: ${ticket.category}`);
      console.log(`[Ticket Service] Priority: ${ticket.priority}`);
      console.log(`[Ticket Service] Description: ${ticket.description}`);
      
      return {
        success: true,
        ticket: ticket
      };
    } catch (error) {
      console.error('[Ticket Service] Error creating ticket:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  flagForManualReview(requestData, reason) {
    try {
      const reviewItem = {
        id: this.generateReviewId(),
        description: requestData.description,
        location: requestData.location,
        userEmail: requestData.userEmail,
        reason: reason,
        status: 'pending_review',
        createdAt: new Date().toISOString()
      };

      console.log(`[Ticket Service] Flagged for manual review: ${reviewItem.id}`);
      console.log(`[Ticket Service] Reason: ${reason}`);
      console.log(`[Ticket Service] Location: ${reviewItem.location}`);
      console.log(`[Ticket Service] Description: ${reviewItem.description}`);
      
      return {
        success: true,
        reviewItem: reviewItem
      };
    } catch (error) {
      console.error('[Ticket Service] Error flagging for review:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  markAsDuplicate(requestData, duplicateTickets) {
    try {
      const duplicateRecord = {
        id: this.generateDuplicateId(),
        description: requestData.description,
        location: requestData.location,
        userEmail: requestData.userEmail,
        originalTicketIds: duplicateTickets.map(ticket => ticket.id),
        status: 'duplicate',
        createdAt: new Date().toISOString()
      };

      console.log(`[Ticket Service] Marked as duplicate: ${duplicateRecord.id}`);
      console.log(`[Ticket Service] Original tickets: ${duplicateRecord.originalTicketIds.join(', ')}`);
      console.log(`[Ticket Service] Location: ${duplicateRecord.location}`);
      
      return {
        success: true,
        duplicateRecord: duplicateRecord,
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

  getTicketsByLocation(location) {
    return this.tickets.filter(ticket => ticket.location === location);
  }

  getAllTickets() {
    return this.tickets;
  }

  getTicketById(id) {
    return this.tickets.find(ticket => ticket.id === id);
  }

  updateTicketStatus(id, status) {
    const ticket = this.getTicketById(id);
    if (ticket) {
      ticket.status = status;
      ticket.updatedAt = new Date().toISOString();
      console.log(`[Ticket Service] Updated ticket ${id} status to: ${status}`);
      return { success: true, ticket };
    }
    return { success: false, error: 'Ticket not found' };
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