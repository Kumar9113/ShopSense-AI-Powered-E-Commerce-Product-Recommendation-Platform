"""Fine-tune DistilBERT on Amazon Polarity reviews.
Run once when you want an Amazon-review-specific sentiment model.
"""
import argparse
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer

parser = argparse.ArgumentParser()
parser.add_argument("--output", default="models/distilbert-amazon-sentiment")
parser.add_argument("--max-train", type=int, default=20000)
parser.add_argument("--max-eval", type=int, default=4000)
args = parser.parse_args()

base = "distilbert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(base)
model = AutoModelForSequenceClassification.from_pretrained(base, num_labels=2)

ds = load_dataset("amazon_polarity")
train = ds["train"].shuffle(seed=42).select(range(min(args.max_train, len(ds["train"]))))
eval_ds = ds["test"].shuffle(seed=42).select(range(min(args.max_eval, len(ds["test"]))))

def tokenize(batch):
    return tokenizer(batch["content"], truncation=True, padding="max_length", max_length=256)

train = train.map(tokenize, batched=True).rename_column("label", "labels")
eval_ds = eval_ds.map(tokenize, batched=True).rename_column("label", "labels")
cols = ["input_ids", "attention_mask", "labels"]
train.set_format(type="torch", columns=cols)
eval_ds.set_format(type="torch", columns=cols)

args_train = TrainingArguments(
    output_dir=args.output,
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    num_train_epochs=2,
    weight_decay=0.01,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    report_to="none",
)
trainer = Trainer(model=model, args=args_train, train_dataset=train, eval_dataset=eval_ds, tokenizer=tokenizer)
trainer.train()
trainer.save_model(args.output)
tokenizer.save_pretrained(args.output)
print(f"Saved Amazon-review sentiment model to {args.output}")
