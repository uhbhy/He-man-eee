import asyncio
from sqlalchemy.future import select
from app.database import SessionLocal
from app.models.user import User
from app.models.quiz import QuizQuestion
from app.models.compliment import Compliment
from app.models.wishlist import WishlistItem
from app.services.auth_service import hash_password


async def seed_users(session):
    print("Seeding users...")
    users_data = [
        {
            "username": "abhi",
            "role": "boyfriend",
            "display_name": "Abhi",
            "password": "planet-J+B"
        },
        {
            "username": "pappuchaaru",
            "role": "girlfriend",
            "display_name": "Abhi's Princess",
            "password": "Planet-J+B"
        }
    ]

    seeded_users = {}
    for user_info in users_data:
        # Check if user already exists
        result = await session.execute(select(User).where(User.username == user_info["username"]))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                username=user_info["username"],
                role=user_info["role"],
                display_name=user_info["display_name"],
                password_hash=hash_password(user_info["password"])
            )
            session.add(user)
            await session.flush()  # Populates user.id
            print(f"Created user: {user.username}")
        else:
            user.role = user_info["role"]
            user.display_name = user_info["display_name"]
            user.password_hash = hash_password(user_info["password"])
            print(f"Updated user: {user.username}")

        seeded_users[user_info["role"]] = user

    return seeded_users


async def seed_quiz_questions(session):
    print("Seeding quiz questions...")
    questions_data = [
        {
            "question": "What is my favorite movie genre?",
            "options": ["Horror", "Sci-Fi", "Comedy", "Romance"],
            "answer": "Comedy",
            "category": "favorites"
        },
        {
            "question": "Which city would I most want to visit?",
            "options": ["Tokyo", "Paris", "New York", "London"],
            "answer": "New York",
            "category": "memories"
        },
        {
            "question": "What is my favorite season?",
            "options": ["Spring", "Summer", "Autumn", "Winter"],
            "answer": "Winter",
            "category": "favorites"
        },
        {
            "question": "How do I take my coffee?",
            "options": ["Black", "With milk & sugar", "I prefer tea", "Cappuccino"],
            "answer": "With milk & sugar",
            "category": "habits"
        },
        {
            "question": "What is my absolute favorite comfort food?",
            "options": ["Pizza", "Burgers", "Tacos", "Ramen"],
            "answer": "Ramen",
            "category": "favorites"
        },
        {
            "question": "What is my favorite hobby on weekends?",
            "options": ["Gaming", "Hiking", "Reading", "Cooking"],
            "answer": "Gaming",
            "category": "favorites"
        },
        {
            "question": "Where did we go on our very first date?",
            "options": ["Coffee Shop", "Italian Restaurant", "Cinema", "Park walk"],
            "answer": "Coffee Shop",
            "category": "memories"
        },
        {
            "question": "What is my favorite color?",
            "options": ["Blue", "Green", "Black", "Red"],
            "answer": "Black",
            "category": "favorites"
        },
        {
            "question": "What size shoe do I wear?",
            "options": ["9", "10", "11", "12"],
            "answer": "10",
            "category": "habits"
        },
        {
            "question": "What is my favorite type of music?",
            "options": ["Rock", "Jazz", "Pop", "Classical"],
            "answer": "Pop",
            "category": "favorites"
        },
        {
            "question": "Which superpower would I choose?",
            "options": ["Flight", "Invisibility", "Time Travel", "Telepathy"],
            "answer": "Time Travel",
            "category": "preferences"
        },
        {
            "question": "What is my dream car?",
            "options": ["Tesla Model S", "Porsche 911", "Ford Mustang", "Jeep Wrangler"],
            "answer": "Porsche 911",
            "category": "preferences"
        },
        {
            "question": "What time do I usually wake up on weekends?",
            "options": ["Before 7 AM", "Around 8-9 AM", "After 10 AM", "Afternoon"],
            "answer": "Around 8-9 AM",
            "category": "habits"
        },
        {
            "question": "What is my favorite board game?",
            "options": ["Monopoly", "Catan", "Chess", "Scrabble"],
            "answer": "Chess",
            "category": "favorites"
        },
        {
            "question": "Which pet do I prefer?",
            "options": ["Dogs", "Cats", "Birds", "Reptiles"],
            "answer": "Dogs",
            "category": "preferences"
        },
        {
            "question": "Where do we usually go during our lunch break?",
            "options": ["Mindspace Social", "Luna Cafe", "IKEA", "Starbucks"],
            "answer": "Luna Cafe",
            "category": "dates"
        },
        {
            "question": "What nickname does Himani call Abhi?",
            "options": ["Baccha", "Mental", "Diva", "Pappu"],
            "answer": "Baccha",
            "category": "inside_jokes"
        },
        {
            "question": "What does Abhi usually call Himani?",
            "options": ["Princess", "Fattu", "Akka", "Monkey"],
            "answer": "Princess",
            "category": "inside_jokes"
        },
        {
            "question": "Who has the cooler hair according to Abhi?",
            "options": ["Abhi", "Himani", "Equal", "Depends"],
            "answer": "Himani",
            "category": "her"
        },
        {
            "question": "When Himani says 'No, I'm fine', what should Abhi do?",
            "options": ["Believe her", "Run away", "Keep asking", "Bring food"],
            "answer": "Keep asking",
            "category": "chaos"
        },
        {
            "question": "How long did Abhi survive before becoming obsessed?",
            "options": ["One week", "One month", "Three months", "Immediately"],
            "answer": "One month",
            "category": "us"
        },
        {
            "question": "Complete the sentence: 'You can't get rid of me that ____.'",
            "options": ["Quickly", "Easily", "Soon", "Late"],
            "answer": "Easily",
            "category": "quotes"
        }
    ]

    for q_info in questions_data:
        result = await session.execute(select(QuizQuestion).where(QuizQuestion.question == q_info["question"]))
        question = result.scalar_one_or_none()

        if not question:
            question = QuizQuestion(
                question=q_info["question"],
                options=q_info["options"],
                answer=q_info["answer"],
                category=q_info["category"]
            )
            session.add(question)
            print(f"Created question: {q_info['question']}")
        else:
            question.options = q_info["options"]
            question.answer = q_info["answer"]
            question.category = q_info["category"]
            print(f"Updated question: {q_info['question']}")


async def seed_compliments(session, boyfriend):
    print("Seeding compliments...")
    compliments_data = [
        "You make every day feel like a gift",
        "The way you laugh is my favorite sound in the world",
        "You are the most beautiful person I know, inside and out",
        "Your kindness and warmth inspire me every single day",
        "I am so incredibly lucky to have you in my life",
        "You have the most beautiful smile I've ever seen",
        "Being with you makes everything else disappear",
        "You are my favorite place to be",
        "Your heart is so pure and beautiful",
        "You bring so much light and joy into my world",
        "I love the way we can talk about everything and nothing at all",
        "You make me want to be a better person",
        "No matter how hard my day is, seeing you makes it all better",
        "You make my heart skip a beat every time you walk into the room",
        "I love your creativity and how you look at the world",
        "You are my best friend and the love of my life",
        "Your hugs are my absolute favorite place",
        "Thank you for being so patient, loving, and understanding",
        "I cherish every single moment I get to spend with you",
        "You are my home",
        "You somehow get prettier every single week and it's honestly unfair",
        "I still blush when you walk towards me.",
        "Thank you for making Hyderabad feel like home.",
        "I hope you never doubt how loved you are.",
        "You have the cutest little smile right before you laugh.",
        "I don't think you realize how much peace you bring me.",
        "Every lunch break with you somehow feels like a vacation.",
        "I still can't believe you chose my dumb ass.",
        "Your hugs reset my entire nervous system.",
        "Watching you get excited about your art is one of my favorite things.",
        "You make even walking around a mall feel like an adventure.",
        "I don't think my eyes know how to stop looking at you.",
        "I still replay our karaoke date in my head.",
        "You're the best plot twist Hyderabad ever gave me.",
        "My happiest days somehow always involve you.",
        "You'll never stop amazing me.",
        "You have absolutely no business being this adorable.",
        "Even your bad hair days are better than everyone else's good hair days.",
        "You make me feel like life is finally going my way.",
        "You turned a city I was only passing through into a place that feels like home."
    ]

    for msg in compliments_data:
        result = await session.execute(select(Compliment).where(Compliment.message == msg))
        comp = result.scalar_one_or_none()

        if not comp:
            comp = Compliment(
                message=msg,
                created_by=boyfriend.id,
                is_active=True
            )
            session.add(comp)
            print(f"Created compliment: {msg[:30]}...")


async def seed_wishlist(session, boyfriend):
    print("Seeding wishlist items...")
    wishlist_data = [
        {
            "category": "date_idea",
            "title": "Cook a new 3-course dinner together from scratch",
            "description": "Find an exciting recipe, buy ingredients together, and cook a gourmet meal."
        },
        {
            "category": "place",
            "title": "Visit the Sakura trees in Kyoto, Japan",
            "description": "Walk under the cherry blossoms in spring."
        },
        {
            "category": "date_idea",
            "title": "Have a stargazing picnic at the nearest national park",
            "description": "Pack a blanket, some wine, and watch the stars."
        },
        {
            "category": "place",
            "title": "Take a weekend trip to a cozy cabin in the woods",
            "description": "Unplug from technology and relax near a fireplace."
        },
        {
            "category": "other",
            "title": "Build a massive fort in the living room and watch movies all night",
            "description": "Use pillows, chairs, and blankets to make a cozy fort."
        },
        {
            "category": "date_idea",
            "title": "Sing karaoke together again until we lose our voices",
            "description": "Because somehow our first karaoke date became one of my favorite memories."
        },
        {
            "category": "date_idea",
            "title": "Paint something together",
            "description": "One canvas. Two idiots. Unlimited creativity."
        },
        {
            "category": "date_idea",
            "title": "Watch an F1 screening together",
            "description": "Cheer, argue over drivers, and eat way too much food."
        },
        {
            "category": "place",
            "title": "Watch the sunrise together at Durgam Cheruvu",
            "description": "Early morning, coffee, and absolutely no alarms after."
        },
        {
            "category": "place",
            "title": "Take a random metro and get off at a random station",
            "description": "No planning. Just see where the day takes us."
        },
        {
            "category": "place",
            "title": "Go cafe hopping around Hyderabad",
            "description": "One whole day dedicated to finding our favorite cafe."
        },
        {
            "category": "other",
            "title": "Decorate matching phone cases together",
            "description": "Princess is in charge of making them look pretty."
        },
        {
            "category": "other",
            "title": "Read our journals to each other one day",
            "description": "When we're both ready."
        },
        {
            "category": "other",
            "title": "Build the ultimate blanket fort and binge movies",
            "description": "No adults allowed."
        }
    ]

    for item_info in wishlist_data:
        result = await session.execute(select(WishlistItem).where(WishlistItem.title == item_info["title"]))
        item = result.scalar_one_or_none()

        if not item:
            item = WishlistItem(
                added_by=boyfriend.id,
                category=item_info["category"],
                title=item_info["title"],
                description=item_info["description"],
                is_done=False
            )
            session.add(item)
            print(f"Created wishlist item: {item_info['title']}")
        else:
            item.category = item_info["category"]
            item.description = item_info["description"]
            print(f"Updated wishlist item: {item_info['title']}")


async def main():
    async with SessionLocal() as session:
        async with session.begin():
            seeded_users = await seed_users(session)
            boyfriend = seeded_users.get("boyfriend")

            await seed_quiz_questions(session)

            if boyfriend:
                await seed_compliments(session, boyfriend)
                await seed_wishlist(session, boyfriend)
            else:
                print("Skipping compliments & wishlist seeding: Boyfriend user not found.")

    print("Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
