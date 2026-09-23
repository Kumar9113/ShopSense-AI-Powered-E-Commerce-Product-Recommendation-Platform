import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputComponent from "@/components/FormElements/InputComponent/index";

describe("InputComponent", () => {
  it("renders the label and placeholder", () => {
    render(
      <InputComponent
        label="Email"
        placeholder="Enter your email"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
  });

  it("defaults to a text input when no type is provided", () => {
    render(<InputComponent label="Name" value="" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
  });

  it("respects an explicit type, e.g. password", () => {
    render(<InputComponent label="Password" type="password" value="" onChange={() => {}} />);
    const input = document.querySelector("input");
    expect(input).toHaveAttribute("type", "password");
  });

  it("displays the current value and calls onChange when the user types", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<InputComponent label="Name" value="" onChange={handleChange} />);
    const input = screen.getByRole("textbox");

    await user.type(input, "a");

    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
