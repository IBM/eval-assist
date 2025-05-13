from enum import Enum


class TaskEnum(str, Enum):
    SUMMARIZATION = "Summarization"
    TEXT_GENERATION = "Text Generation"
    QUESTION_ANSWERING = "Question Answering"


class DomainEnum(str, Enum):
    NEWS_MEDIA_DOMAIN = "News Media"
    HEALTHCARE = "Healthcare"
    ENTERTAINMENT_AND_POP_CULTURE = "Entertainment And Pop Culture"

    SOCIAL_MEDIA = "Social Media"
    CUSTOMER_SUPPORT_AND_BUSSINESS = "Custumer Support And Business"
    GAMING_AND_ENTERTAINMENT = "Gaming And Entertainment"


class PersonaEnum(str, Enum):
    EXPERIENCED_JOURNALIST = "Experienced journalist"
    NOVICE_JOURNALIST = "Novice journalist"
    OPINION_COLUMNIST = "Opinion columnist"
    NEWS_ANCHOR = "News anchor"
    EDITOR = "Editor"

    MEDICAL_RESEARCHER = "Medical researcher"
    GENERAL_PRACTITIONER = "General practitioner"
    PUBLIC_HEALTH_OFFICIAL = "Public health official"
    HEALTH_BLOGGER = "Health blogger"
    MEDICAL_STUDENT = "Medical student"

    FILM_CRITIC = "Film critic"
    CASUAL_SOCIAL_MEDIA_USER = "Casual social media user"
    TABLOID_REPORTER = "Tabloid reporter"
    HARDCORE_FAN_THEORIST = "Hardcore fan/Theorist"
    INFLUENCER_YOUTUBE_REVIEWER = "Inlfuencer/Youtube reviewer"

    INFLUENCER_POSITIVE_BRAND = "Influencer (Positive brand)"
    INTERNET_TROLL = "Internet troll"
    POLITICAL_ACTIVIST = "Political activist (polarizing)"
    BRAND_VOICE = "Brand voice (Corporate social media account)"
    MEMER = "Memer (Meme creator)"
    CUSTOMER_SERVICE_AGENT = "Customer service agent"
    ANGRY_CUSTOMER = "Angry customer"
    CORPORATE_CEO = "Corporate CEO"
    CONSUMER_ADVOCATE = "Consumer advocate"
    MAKETING_SPECIALIST = "Marketing specialist"

    FLAMER = "Flamer (Agressive player)"
    HARDCORE_GAMER = "Hardcore gamer"
    ESPORT_COMENTATOR = "Esport commentator"
    MOVIE_CRITIC = "Movie critic"
    FAN = "Fan (of a TV show, movie, or game)"


class GenerationLengthEnum(str, Enum):
    SHORT = "Short"
    MEDIUM = "Medium"
    LONG = "Long"


class DirectActionTypeEnum(str, Enum):
    REGENERATE = "Regenerate"
    REPHRASE = "Rephrase"
    LONGER = "Elaborate"
    SHORTER = "Shorten"
    CUSTOM = "Custom"
