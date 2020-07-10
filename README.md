# AirDesk Airtable Block

Block that helps prioritise support tickets based on urgency of the issue by performing sentiment analysis on the ticket description.

## Inspiration

Customer service expectations are becoming more demanding as time goes on. Latest study shows that 88% of service professionals believe that customers have higher expectations than they did in the past.

Meeting these expectations builds trust with your customers. Missing them creates more frustration. As the volume increases, the "first-in, first-out" system that most company employ means that customers with urgent needs get stuck at the back of the line. So if a system that is important for a business to make money goes down, the higher the loss, the more severe the impact, the higher the priority.

Priority support can help your team close the gap between how customers feel they should be treated and the level of support they actually receive.Team's response time should be dictated by the level of support your customer has and the urgency of the issue they're experiencing. Priority support highlights these customers and helps your team resolve their issues in a timely manner.

Not sure how to create this process for prioritisation? We use sentiment analysis to determine urgency and importance of the ticket and place it accordingly in the queue.

## What it does

Airdesk analyses the sentiment of the block using AWS comprehend. By analysing the sentiment, it determines the urgency, importance and criticality of the issue described and ranks the ticket and positions them accordingly in the queue.

It categorises as follows:

Low: These questions are from people who aren't active customers or leads. This includes sponsorship requests and general customer feedback that doesn't require an immediate response.

Medium: These are questions or issues that aren't blocking customers from using the product, but they do require a quick response.

High: These issues prevent using the product or service effectively. They require an immediate response.

Urgent: These are issues that either completely blocks the use of the product or are coming from upset customers who need their case escalated. These problems should always be your top priority.

AirDesk block can also be used for the following use cases:
- It can be used to categorize reviews as positive, negative and neutral.
- It can be used to understand the shortcomings of products by getting keywords from negative reviews for the product.

## How we built it

Once a new ticket along with this description is entered into the table, the description of the ticket is sent to aws comprehend that uses machine learning to find insights and relationships in text .

The Machine learning algorithms are used to accurately identify specific items of interest inside vast swathes of text (such as finding company names in analyst reports), and used to learn the sentiment hidden inside language (identifying negative reviews, or positive customer interactions with customer service agents). 

Based on this sentiment analysis, the ticket is categorised into low, medium or High priority and ranked and sorted accordingly in Queue.


## See the block running

![airdesk](https://raw.githubusercontent.com/msvdpriya/AirDesk/master/media/airdesk.png "AirDesk")

## Accomplishments that we're proud of

We are proud of being able to build an application in the domain in which we have no prior knowledge.

## What we learned

We learnt how easy it is to build and publish an application with Airtable and how it can be further expanded with custom blocks. Also, how seamlessly we can use tables in airtable. Anyone with no prior knowledge on sql or nosql database can build amazing application with Airtable. 

## What's next for Sentiment Analysis based Ticket Prioritisation System

- Ability to customise priority by including a rule based system.
- Expand usage of the block beyond service desk providers and use it to analyze sentiments from movie reviews, product reviews, app reviews etc..

## How to run this block

1. Create a new base

2. Create a new block in your new base (see
   [Create a new block](https://airtable.com/developers/blocks/guides/hello-world-tutorial#create-a-new-block))

3. From the root of your new block, run `block run`.

4. Configure AWS credentials of an IAM user who has FullAccess to AWS Comprehend service.
  a. [Create IAM user](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html#id_users_create_console)
  b. [Create AWS Credentials](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys) 
