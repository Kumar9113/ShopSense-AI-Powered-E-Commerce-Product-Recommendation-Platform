import { render, screen } from "@testing-library/react";
import ComponentLevelLoader from "@/components/Loader/componentlevel/index";

describe("ComponentLevelLoader", () => {
  it("renders the accompanying text", () => {
    render(<ComponentLevelLoader text="Loading..." loading={true} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the spinner while loading is true", () => {
    render(<ComponentLevelLoader text="Please wait" loading={true} />);
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("can be rendered without text", () => {
    render(<ComponentLevelLoader loading={true} />);
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });
});
