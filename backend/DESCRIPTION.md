# Backend

## When Request is Recieved

When a new request is recieved, it should be sent off to an AI model for
classification. This AI model should classify it into one of the categories
found in work-requests.json. If none of the categories fit, it should be flagged
for manual review. (Just print to the screeen for now, but make it an easy
function to edit later)

Once the request is categorized, another AI request should be made to check if
any existing tickets already cover the same issue. If so, the ticket should be
marked as duplicate. (Just print to the screeen for now, but make it an easy
function to edit later)

- Before submitting to the AI model for duplicate checking, first narrow it down
  to only tickets in the same building. Then run the check based on content of
  the message.

If the request is new, create a new maintainence ticket. (Just print to the
screeen for now, but make it an easy function to edit later)
