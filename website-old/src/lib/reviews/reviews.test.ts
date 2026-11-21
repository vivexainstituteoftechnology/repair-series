import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateServiceRatingStats,
  formatCustomerDisplayName,
  validateReviewInput,
} from "./calculation";

test("calculateServiceRatingStats returns null when no reviews exist", () => {
  const stats = calculateServiceRatingStats([]);
  assert.equal(stats.averageRating, null);
  assert.equal(stats.totalReviews, 0);
  assert.deepEqual(stats.distribution, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
});

test("calculateServiceRatingStats calculates exact average and distribution", () => {
  const reviews = [
    { rating: 5, status: "published" },
    { rating: 5, status: "published" },
    { rating: 4, status: "published" },
    { rating: 4, status: "published" },
    { rating: 5, status: "published" },
  ];
  // Sum = 5+5+4+4+5 = 23, 23/5 = 4.6
  const stats = calculateServiceRatingStats(reviews);
  assert.equal(stats.averageRating, 4.6);
  assert.equal(stats.totalReviews, 5);
  assert.equal(stats.distribution[5], 3);
  assert.equal(stats.distribution[4], 2);
  assert.equal(stats.distribution[3], 0);
  assert.equal(stats.percentages[5], 60);
  assert.equal(stats.percentages[4], 40);
});

test("calculateServiceRatingStats ignores hidden/moderated reviews", () => {
  const reviews = [
    { rating: 5, status: "published" },
    { rating: 1, status: "hidden" }, // Should be excluded from calculation
  ];
  const stats = calculateServiceRatingStats(reviews);
  assert.equal(stats.averageRating, 5.0);
  assert.equal(stats.totalReviews, 1);
  assert.equal(stats.distribution[1], 0);
});

test("formatCustomerDisplayName formats names and masks phone numbers", () => {
  assert.equal(formatCustomerDisplayName("Rahul Sharma"), "Rahul S.");
  assert.equal(formatCustomerDisplayName("Amit Kumar Verma"), "Amit V.");
  assert.equal(formatCustomerDisplayName("Pooja"), "Pooja");
  assert.equal(formatCustomerDisplayName(null, "+919876543210"), "Customer ···3210");
  assert.equal(formatCustomerDisplayName("9876543210"), "Customer ···3210");
  assert.equal(formatCustomerDisplayName(""), "Verified Customer");
});

test("validateReviewInput validates rating and limits comment length", () => {
  const valid = validateReviewInput({
    bookingId: "b-123",
    rating: 5,
    comment: "Excellent service!",
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.rating, 5);
  assert.equal(valid.comment, "Excellent service!");

  const missingBooking = validateReviewInput({ rating: 4 });
  assert.equal(missingBooking.valid, false);

  const invalidRating = validateReviewInput({ bookingId: "b-123", rating: 6 });
  assert.equal(invalidRating.valid, false);

  const zeroRating = validateReviewInput({ bookingId: "b-123", rating: 0 });
  assert.equal(zeroRating.valid, false);

  const hugeComment = "a".repeat(2001);
  const tooLong = validateReviewInput({
    bookingId: "b-123",
    rating: 4,
    comment: hugeComment,
  });
  assert.equal(tooLong.valid, false);
});
