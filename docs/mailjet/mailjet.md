Getting Started
In this section we will guide you through the core features of the Mailjet Email API : sending an email and retrieving information about your sent messages, including engagement statistics (opens, clicks, etc.).

Let’s start!

Prerequisites
To use the Mailjet Email API, you need to:

Create a Mailjet account, then retrieve your API and Secret keys. They will be used for authentication purposes.
Make sure you have cURL installed on your machine, or use one of our official libraries in PHP, Python, Node.js, Java, C#, Go, and Ruby.
Alternatively, you can use Postman to test the different API endpoints. Click on the button below to import a pre-made collection of examples.

We also suggest that you create environment variables for your API and Secret keys for easy input.

On Mac OS / Linux:
1
export $MJ_APIKEY_PUBLIC='Enter your API Key here'
2
export $MJ_APIKEY_PRIVATE='Enter your API Secret here'
On Windows:
1
setx -m $MJ_APIKEY_PUBLIC "Enter your API Key here"
2
setx -m $MJ_APIKEY_PRIVATE "Enter your API Secret here"
Send your first email
First, define the sender and recipient email as environment variables. Keep in mind that the sender email should be validated in your Mailjet account (your signup email address will be automatically validated).

On Mac OS / Linux:
1
export $SENDER_EMAIL='Enter your sender email address here'
2
export $RECIPIENT_EMAIL='Enter your recipient email address here'
On Windows:
1
setx -m $SENDER_EMAIL "Enter your sender email address here"
2
setx -m $RECIPIENT_EMAIL "Enter your recipient email address here"
Then use the code sample to send a message.

cURLPHPNODERUBYPYTHONJAVAGOC#
1
# Run:
2
curl -s \
3
  -X POST \
4
  --user "$MJ_APIKEY_PUBLIC:$MJ_APIKEY_PRIVATE" \
5
  https://api.mailjet.com/v3.1/send \
6
  -H 'Content-Type: application/json' \
7
  -d '{
8
    "Messages":[
9
        {
10
            "From": {
11
                "Email": "$SENDER_EMAIL",
12
                "Name": "Me"
13
            },
14
            "To": [
15
                {
16
                    "Email": "$RECIPIENT_EMAIL",
17
                    "Name": "You"
18
                }
19
            ],
20
            "Subject": "My first Mailjet Email!",
21
            "TextPart": "Greetings from Mailjet!",
22
            "HTMLPart": "<h3>Dear passenger 1, welcome to <a href=\"https://www.mailjet.com/\">Mailjet</a>!</h3><br />May the delivery force be with you!"
23
        }
24
    ]
25
  }'
API response:

1
{
2
  "Messages": [
3
    {
4
      "Status": "success",
5
      "To": [
6
        {
7
          "Email": "passenger@mailjet.com",
8
          "MessageID": "1234567890987654321",
9
          "MessageHref": "https://api.mailjet.com/v3/message/1234567890987654321"
10
        }
11
      ]
12
    }
13
  ]
14
}
Congratulations - you have successfully sent your first email!

Save the MessageID - we will need it in the next section to access detailed information about the sent email.

