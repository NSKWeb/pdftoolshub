import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolUploadForm } from '@/components/tool-upload-form';

global.fetch = jest.fn();

describe('ToolUploadForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload form', () => {
    render(<ToolUploadForm tool="merge" />);
    
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run tool/i })).toBeInTheDocument();
  });

  it('shows error for invalid file type', async () => {
    const user = userEvent.setup();
    render(<ToolUploadForm tool="merge" />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/file upload input/i);
    
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: /run tool/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/please select at least one file/i)).toBeInTheDocument();
    });
  });

  it('handles successful submission', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        message: 'Processing complete',
        downloadUrl: '/download/test.pdf'
      })
    });

    const user = userEvent.setup();
    render(<ToolUploadForm tool="merge" />);
    
    const file = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/file upload input/i);
    
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: /run tool/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/processing complete/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    render(<ToolUploadForm tool="merge" />);
    
    const file = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/file upload input/i);
    
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: /run tool/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();
    });
  });
});
